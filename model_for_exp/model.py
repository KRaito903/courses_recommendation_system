from typing import Dict, List, Tuple, Union
import torch
from collections import defaultdict
from sklearn.model_selection import train_test_split
import numpy as np
import json
import torch.nn.functional as F
from sklearn.metrics import ndcg_score
from torch_geometric.data import Data, HeteroData

from graph_builder import GraphBuilder
from basic_gnn_models import LightGCNRecommender, GCNRecommender, GraphSAGERecommender, KGATRecommender

class CourseRecommendationModel:
    """Main recommendation system with multiple model support"""
    def __init__(self, data: Dict, embedding_dim: int = 64, num_layers: int = 3,
                 using_unenrolled_for_test: bool = False, unenrolled_rate_in_graph: float = 0.0,
                 test_split: float = 0.2, valid_split: float = 0.1, model_type: str = 'lightgcn'):
        """
        Args:
            data: Course dataset
            embedding_dim: Embedding dimension
            num_layers: Number of GNN layers
            unenrolled_rate_in_graph: Rate of including unenrolled courses as negative samples in training
            using_unenrolled_for_test: Whether to use unenrolled courses as test set
            test_split: Proportion of data to use for testing
            valid_split: Proportion of data to use for validation
            model_type: Type of GNN model to use ('lightgcn', 'gcn', 'graphsage', 'kgat')
        """
        self.data = data
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers
        self.using_unenrolled_for_test = using_unenrolled_for_test
        self.unenrolled_rate_in_graph = unenrolled_rate_in_graph
        # Backwards-compatible alias: some methods reference 'unenrolled_rate'
        # so keep both names in sync to avoid AttributeError.
        self.unenrolled_rate = unenrolled_rate_in_graph
        self.test_split = test_split
        self.valid_split = valid_split
        self.model_type = model_type
        
        # Determine if features are needed based on model type
        self.use_features = model_type in ['gcn', 'graphsage']
        
        # Build graph
        self.graph_builder = GraphBuilder(data, self.unenrolled_rate_in_graph)
        self.graph = self.graph_builder.build_homogeneous_graph(use_features=self.use_features) # for LightGCN, GCN
        # self.graph = self.graph_builder.build_heterogeneous_graph() # for KGAT, GraphSAGE

        self.num_students = len(data['students'])
        self.num_courses = len(data['courses'])
        
        # Build model
        self.model = self._build_model()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        # Prepare training data
        self._prepare_training_data()

    def train(self, num_epochs: int = 50, batch_size: int = 256,
            num_negative: int = 1,
            is_eval_during_training: bool = False, ks: List[int] = [1, 3, 10],
            is_save_model: bool = True, filepath: str = "./model/final_model_state.pth",
            early_stopping_patience: int = 10, early_stopping_min_delta: float = 0.0001,
            use_early_stopping: bool = True):
        """Train the recommendation model.

        Args:
            num_epochs: Maximum number of training epochs
            batch_size: Batch size for training
            num_negative: Number of negative samples per positive sample
            is_eval_during_training: Whether to evaluate on validation set during training
            ks: List of k values for evaluation metrics
            is_save_model: Whether to save the final model
            filepath: Path to save the model
            early_stopping_patience: Number of epochs to wait for improvement before stopping
            early_stopping_min_delta: Minimum change in validation loss to qualify as an improvement
            use_early_stopping: If True, enable early stopping based on validation loss; if False, train full epochs
        """
        best_val_loss = float('inf')
        best_model_state = None
        patience_counter = 0
        
        for epoch in range(num_epochs):
            self.model.train(mode=True)

            total_loss = 0
            num_batches = 0
            
            # Shuffle training samples
            train_samples = self.train_samples.copy()
            np.random.shuffle(train_samples)
            
            for i in range(0, len(train_samples), batch_size):
                batch = train_samples[i:i + batch_size]
                user_ids = [s[0] for s in batch]
                positive_items = [s[1] for s in batch]
                
                # Negative sampling
                negative_samples = self._negative_sampling(user_ids, num_negative)
                negative_items = [s[1] for s in negative_samples]
                
                # Forward pass
                if self.model_type in ['lightgcn', 'kgat']:
                    user_embedding, item_embedding = self.model(self.graph.edge_index)
                    users = user_embedding[user_ids]
                    positive_items_embedding = item_embedding[positive_items]
                    negative_items_embedding = item_embedding[negative_items]  
                else:  # GCN, GraphSAGE
                    embeddings = self.model(self.graph.x, self.graph.edge_index)
                    users = embeddings[user_ids]
                    positive_items_embedding = embeddings[[p + self.num_students for p in positive_items]]
                    negative_items_embedding = embeddings[[n + self.num_students for n in negative_items]]
                
                # BPR loss supporting multiple negatives per positive
                # negative_items_embedding currently shape: (batch_size * num_negative, emb_dim)
                # Reshape to (batch_size, num_negative, emb_dim) to align with users
                if num_negative > 0:
                    # Ensure we have the expected number of negatives
                    expected = len(user_ids) * num_negative
                    if negative_items_embedding.size(0) != expected:
                        raise RuntimeError(
                            f"Negative sampling size mismatch: got {negative_items_embedding.size(0)}, expected {expected}."
                        )
                    negative_items_embedding = negative_items_embedding.view(len(user_ids), num_negative, -1)
                else:
                    raise ValueError("num_negative must be >= 1")

                # positive scores: (batch, 1)
                positive_scores = (users * positive_items_embedding).sum(dim=1, keepdim=True)
                # negative scores: (batch, num_negative)
                negative_scores = (users.unsqueeze(1) * negative_items_embedding).sum(dim=2)
                # BPR: average over all negatives
                loss = -F.logsigmoid(positive_scores - negative_scores).mean()
                
                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
                num_batches += 1
            train_loss = total_loss / num_batches
            
            # Compute validation loss for early stopping or for evaluation prints
            if use_early_stopping or is_eval_during_training:
                val_loss = self._compute_validation_loss(batch_size, num_negative)
            else:
                val_loss = None
            
            # Evaluate during training if requested
            if is_eval_during_training:
                eval_results = self.evaluate(ks)
                eval_str = ', '.join([f"Hit@{k}: {eval_results[f'hit@{k}']:.4f}, NDCG@{k}: {eval_results[f'ndcg@{k}']:.4f}" for k in ks])
                if val_loss is not None:
                    print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f} \n {eval_str} \n MRR: {eval_results['mrr']:.4f}")
                else:
                    print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f} \n {eval_str} \n MRR: {eval_results['mrr']:.4f}")
            else:
                if val_loss is not None:
                    print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
                else:
                    print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f}")
            
            # Early stopping logic (only when enabled)
            if use_early_stopping:
                # If val_loss couldn't be computed for some reason, skip early stopping for this epoch
                if val_loss is None:
                    print("  → Early stopping is enabled but validation loss was not computed for this epoch; skipping early-stopping check.")
                else:
                    if val_loss < best_val_loss - early_stopping_min_delta:
                        best_val_loss = val_loss
                        best_model_state = self.model.state_dict().copy()
                        patience_counter = 0
                        print(f"  → Validation loss improved to {val_loss:.4f}. Saving best model.")
                    else:
                        patience_counter += 1
                        print(f"  → No improvement. Patience: {patience_counter}/{early_stopping_patience}")

                        if patience_counter >= early_stopping_patience:
                            print(f"Early stopping triggered after {epoch+1} epochs.")
                            # Restore best model
                            if best_model_state is not None:
                                self.model.load_state_dict(best_model_state)
                                print("Restored best model from early stopping.")
                            break

        # if is_save_model:
            # # Save final (or best) model state into a file
            # # Ensure parent directory exists to avoid IO errors (e.g., on Kaggle)
            # import os
            # parent = os.path.dirname(filepath) or '.'
            # try:
            #     os.makedirs(parent, exist_ok=True)
            # except Exception:
            #     # If creating directories fails, continue and let torch.save raise the error
            #     pass

            # if best_model_state is not None:
            #     torch.save(best_model_state, filepath)
            #     print(f"Best model state saved to '{filepath}'")
            # else:
            #     torch.save(self.model.state_dict(), filepath)
            #     print(f"Final model state saved to '{filepath}'")

    def load_model(self, filepath: str = "./model/final_model_state.pth"):
        """Load model state from a saved state dictionary"""
        import os
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model checkpoint not found: {filepath}")
        # torch.load may raise if file is corrupted or incompatible
        model_state = torch.load(filepath)
        # model_state may be either a full state_dict or a saved 'best_model_state'
        try:
            self.model.load_state_dict(model_state)
        except Exception:
            # If the saved object isn't a direct state_dict, try extracting common keys
            if isinstance(model_state, dict) and 'state_dict' in model_state:
                self.model.load_state_dict(model_state['state_dict'])
            else:
                # Re-raise to surface the incompatibility
                raise

    def evaluate(self, ks: List[int] = [1, 3, 10]) -> Dict[str, float]:
        """Evaluate on test set for multiple k values"""
        self.model.eval()
        
        with torch.no_grad():
            if self.model_type in ['lightgcn', 'kgat']:
                user_embedding, item_embedding = self.model(self.graph.edge_index)
            else:
                embeddings = self.model(self.graph.x, self.graph.edge_index)
                user_embedding = embeddings[:self.num_students]
                item_embedding = embeddings[self.num_students:]
        
        test_users = list(set([s[0] for s in self.test_samples]))
        metrics = {f'hit@{k}': [] for k in ks}
        # Add recall@k and ndcg@k lists
        metrics.update({f'recall@{k}': [] for k in ks})
        metrics.update({f'ndcg@{k}': [] for k in ks})
        mrrs = []

        for user_id in test_users:
            test_items = [s[1] for s in self.test_samples if s[0] == user_id]
            if not test_items:
                continue
            
            user_vec = user_embedding[user_id]
            scores = torch.matmul(item_embedding, user_vec)
            
            train_items = list(self.user_positive_items[user_id])
            scores[train_items] = -float('inf')
            
            # MRR
            sorted_items = torch.argsort(scores, descending=True).cpu().numpy()
            mrr = 0.0
            for rank, item in enumerate(sorted_items, start=1):
                if item in test_items:
                    mrr = 1.0 / rank
                    break
            mrrs.append(mrr)

            for k in ks:
                _, top_k_items = torch.topk(scores, k)
                top_k_items = top_k_items.cpu().numpy()

                # Hit@k (binary: is there any relevant item in top-k)
                hit = int(len(set(top_k_items) & set(test_items)) > 0)
                metrics[f'hit@{k}'].append(hit)

                # Recall@k: (# relevant items in top-k) / (total relevant items for user)
                if len(test_items) > 0:
                    num_rel_in_topk = len(set(top_k_items) & set(test_items))
                    recall = num_rel_in_topk / float(len(test_items))
                else:
                    recall = 0.0
                metrics[f'recall@{k}'].append(recall)

                # NDCG@k: compute using sklearn's ndcg_score; handle edge cases
                relevance = [1 if item in test_items else 0 for item in top_k_items]
                ideal_count = min(len(test_items), k)
                ideal_relevance = [1] * ideal_count + [0] * (k - ideal_count)
                if sum(ideal_relevance) > 0:
                    try:
                        metrics[f'ndcg@{k}'].append(ndcg_score([ideal_relevance], [relevance]))
                    except Exception:
                        # Fallback: if ndcg fails for tiny inputs, append 0.0
                        metrics[f'ndcg@{k}'].append(0.0)
                else:
                    metrics[f'ndcg@{k}'].append(0.0)

        results = {'mrr': np.mean(mrrs)}
        for k in ks:
            results[f'hit@{k}'] = np.mean(metrics[f'hit@{k}']) if len(metrics[f'hit@{k}']) > 0 else 0.0
            results[f'recall@{k}'] = np.mean(metrics[f'recall@{k}']) if len(metrics[f'recall@{k}']) > 0 else 0.0
            results[f'ndcg@{k}'] = np.mean(metrics[f'ndcg@{k}']) if len(metrics[f'ndcg@{k}']) > 0 else 0.0
        return results
    
    def recommend_courses(self, student_id: int, semester_filter: int = 0,
                          k: int = 10,
                          is_save_recommendations: bool = True, filepath_prefix: str = './data/recommendations') -> List[Dict]:
        """Recommend top-k courses for a student that are at or below their current semester level"""
        self.model.eval()
        
        # Get student's current semester
        student_info = next(s for s in self.data['students'] if s['student_id'] == student_id)
        student_semester = student_info['semester']
        
        with torch.no_grad():
            if self.model_type in ['lightgcn', 'kgat']:
                user_embedding, item_embedding = self.model(self.graph.edge_index)
            else:
                embeddings = self.model(self.graph.x, self.graph.edge_index)
                user_embedding = embeddings[:self.num_students]
                item_embedding = embeddings[self.num_students:]
            
            # Compute scores
            user_vec = user_embedding[student_id]
            scores = torch.matmul(item_embedding, user_vec)
            
            # Remove already enrolled courses
            enrolled_courses = list(self.user_positive_items[student_id])
            scores[enrolled_courses] = -float('inf')
            
            # Remove courses from higher semesters
            for course_id in range(len(scores)):
                course_info = next(c for c in self.data['courses'] if c['course_id'] == course_id)

                if semester_filter > 0:
                    if course_info['semester'] != semester_filter:
                        scores[course_id] = -float('inf')
                else:
                    if course_info['semester'] > student_semester:
                        scores[course_id] = -float('inf')
            
            # Get more recommendations than needed in case some are filtered
            top_scores, candidate_items = torch.topk(scores, min(k * 2, len(scores)))
            candidate_items = candidate_items.cpu().numpy()
            top_scores = top_scores.cpu().numpy()
            
            # Filter and take only top k valid recommendations
            valid_items = []
            valid_scores = []
            for idx, (item, score) in enumerate(zip(candidate_items, top_scores)):
                if score > -float('inf') and len(valid_items) < k:
                    valid_items.append(item)
                    valid_scores.append(float(score))  # Convert to Python float
            
            top_k_items = valid_items
            top_scores = valid_scores
        
        # Format recommendations
        recommendations = []
        for idx, (course_id, score) in enumerate(zip(top_k_items, top_scores)):
            # Ensure plain Python types for JSON serialization
            py_course_id = int(course_id)  # cast possible numpy/int64
            py_score = float(score)
            recommendations.append({
                'rank': int(idx + 1),
                'course_id': py_course_id,
                'score': py_score
            })

        if is_save_recommendations:
            # Save recommendations to a file
            if semester_filter > 0:
                filepath = f'{filepath_prefix}_student_{student_id}_semester_{semester_filter}.json'
            else:
                filepath = f'{filepath_prefix}_student_{student_id}.json'

            # Sanitize again in case future modifications introduce non-serializable types
            serializable_recs = []
            for r in recommendations:
                serializable_recs.append({
                    'rank': int(r['rank']),
                    'course_id': int(r['course_id']),
                    'score': float(r['score'])
                })
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(serializable_recs, f, indent=2, ensure_ascii=False)
            print(f"Recommendations saved to '{filepath}'")
        return recommendations

    def update_graph(self, new_graph: Union[Data, HeteroData]):
        """Update the graph with new data while preserving model weights"""
        self.heterogeneous_graph = new_graph
        self._prepare_training_data()

    def _build_model(self):
        """Build the specified model"""
        if self.model_type == 'lightgcn':
            return LightGCNRecommender(
                self.num_students, self.num_courses, 
                self.embedding_dim, self.num_layers
            )
        
        if self.model_type == 'gcn':
            in_channels = self.graph.x.size(1)
            return GCNRecommender(in_channels, self.embedding_dim, self.num_layers)
        
        if self.model_type == 'graphsage':
            in_channels = self.graph.x.size(1)
            return GraphSAGERecommender(in_channels, self.embedding_dim, self.num_layers)
    
        if self.model_type == 'kgat':
            return KGATRecommender(
                self.num_students, self.num_courses,
                self.embedding_dim, self.num_layers
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def _compute_validation_loss(self, batch_size: int = 256, num_negative: int = 1) -> float:
        """Compute validation loss on validation set for early stopping."""
        self.model.eval()
        total_val_loss = 0
        num_batches = 0
        
        with torch.no_grad():
            for i in range(0, len(self.valid_samples), batch_size):
                batch = self.valid_samples[i:i + batch_size]
                user_ids = [s[0] for s in batch]
                positive_items = [s[1] for s in batch]
                
                # Negative sampling for validation
                negative_samples = self._negative_sampling(user_ids, num_negative)
                negative_items = [s[1] for s in negative_samples]
                
                # Forward pass
                if self.model_type in ['lightgcn', 'kgat']:
                    user_embedding, item_embedding = self.model(self.graph.edge_index)
                    users = user_embedding[user_ids]
                    positive_items_embedding = item_embedding[positive_items]
                    negative_items_embedding = item_embedding[negative_items]
                else:  # GCN, GraphSAGE
                    embeddings = self.model(self.graph.x, self.graph.edge_index)
                    users = embeddings[user_ids]
                    positive_items_embedding = embeddings[[p + self.num_students for p in positive_items]]
                    negative_items_embedding = embeddings[[n + self.num_students for n in negative_items]]
                
                # Reshape negatives
                if num_negative > 0:
                    expected = len(user_ids) * num_negative
                    if negative_items_embedding.size(0) == expected:
                        negative_items_embedding = negative_items_embedding.view(len(user_ids), num_negative, -1)
                    else:
                        # Handle edge case where batch doesn't divide evenly
                        continue
                
                # Compute BPR loss
                positive_scores = (users * positive_items_embedding).sum(dim=1, keepdim=True)
                negative_scores = (users.unsqueeze(1) * negative_items_embedding).sum(dim=2)
                loss = -F.logsigmoid(positive_scores - negative_scores).mean()
                
                total_val_loss += loss.item()
                num_batches += 1
        
        return total_val_loss / num_batches if num_batches > 0 else float('inf')
    
    def _prepare_training_data(self):
        """Prepare train/validation/test split"""
        enrollments = [e for e in self.data['enrollments'] if e['is_enrolled'] == 1]
        unenrollments = [e for e in self.data['enrollments'] if e['is_enrolled'] == 0]

        if self.using_unenrolled_for_test:
            # Use full unenrollments for test samples (store raw course_id)
            self.test_samples = [(e['student_id'], e['course_id']) for e in unenrollments]

            # Use full enrollments for positive samples (store raw course_id)
            positive_samples = [(e['student_id'], e['course_id']) for e in enrollments]
            # If dataset is very small, do a safe manual split instead of
            # relying on sklearn.train_test_split which can raise when a
            # resulting split would be empty.
            n = len(positive_samples)
            if n == 0:
                self.train_samples = []
                self.valid_samples = []
            else:
                np.random.seed(36)
                indices = np.arange(n)
                np.random.shuffle(indices)
                n_valid = int(round(n * self.valid_split))
                # Ensure at least one training sample when possible
                if n - n_valid <= 0:
                    n_valid = max(0, n - 1)
                n_train = n - n_valid
                train_idx = indices[:n_train]
                valid_idx = indices[n_train:n_train + n_valid]
                self.train_samples = [positive_samples[i] for i in train_idx.tolist()]
                self.valid_samples = [positive_samples[i] for i in valid_idx.tolist()]
        else:
            if self.unenrolled_rate > 0.0:
                # sample unenrollments safely
                if len(unenrollments) > 0:
                    sample_size = int(len(unenrollments) * self.unenrolled_rate)
                    sample_size = min(sample_size, len(unenrollments))
                    if sample_size > 0:
                        chosen_unenrollments = list(np.random.choice(unenrollments, size=sample_size, replace=False))
                        enrollments = enrollments + chosen_unenrollments

            # Positive samples (store raw course_id)
            positive_samples = [(e['student_id'], e['course_id']) for e in enrollments]

            # Manual, robust split to avoid empty-train situations on tiny datasets
            n = len(positive_samples)
            if n == 0:
                self.train_samples = []
                self.valid_samples = []
                self.test_samples = []
            else:
                np.random.seed(36)
                indices = np.arange(n)
                np.random.shuffle(indices)

                n_test = int(round(n * self.test_split))
                n_valid = int(round(n * self.valid_split))

                # Make sure counts sum to n and leave at least one train sample when possible
                if n_test + n_valid >= n:
                    # reserve at least one for training
                    if n >= 1:
                        n_train = 1
                        remaining = n - n_train
                        # allocate remaining to valid/test proportionally
                        if remaining > 0:
                            # assign test first
                            n_test = min(remaining, n_test)
                            n_valid = remaining - n_test
                        else:
                            n_test = 0
                            n_valid = 0
                    else:
                        n_train = 0
                else:
                    n_train = n - n_test - n_valid

                # slice indices
                train_idx = indices[:n_train]
                valid_idx = indices[n_train:n_train + n_valid]
                test_idx = indices[n_train + n_valid: n_train + n_valid + n_test]

                self.train_samples = [positive_samples[i] for i in train_idx.tolist()]
                self.valid_samples = [positive_samples[i] for i in valid_idx.tolist()]
                self.test_samples = [positive_samples[i] for i in test_idx.tolist()]
            
        # Create user-item matrix for negative sampling
        self.user_positive_items = defaultdict(set)
        for student_id, course_id in positive_samples:
            self.user_positive_items[student_id].add(course_id)

    def _negative_sampling(self, user_ids: List[int], num_negative: int = 1) -> List[Tuple[int, int]]:
        """Sample negative items for users"""
        negative_samples = []
        for user_id in user_ids:
            positive_items = self.user_positive_items[user_id]

            for _ in range(num_negative):
                negative_item = np.random.randint(0, self.num_courses)
                while negative_item in positive_items:
                    negative_item = np.random.randint(0, self.num_courses)

                negative_samples.append((user_id, negative_item))
        return negative_samples