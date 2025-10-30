from typing import Dict, List, Tuple
import torch
from collections import defaultdict
from sklearn.model_selection import train_test_split
import numpy as np
import torch.nn.functional as F
from sklearn.metrics import ndcg_score

from graph_builder import KnowledgeGraphBuilder
from gcn_recommender import GCNRecommender
from lightgcn_recommender import LightGCNRecommender
from graphsage_recommender import GraphSAGERecommender
from kgat_recommender import KGATRecommender

class CourseRecommendationSystem:
    """Main recommendation system with multiple model support"""
    def __init__(self, data: Dict, model_type: str = 'lightgcn', 
                 embedding_dim: int = 64, num_layers: int = 3):
        """
        Args:
            data: Course dataset
            model_type: 'gcn', 'lightgcn', 'graphsage', 'kgat'
            embedding_dim: Embedding dimension
            num_layers: Number of GNN layers
        """
        self.data = data
        self.model_type = model_type.lower()
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers
        
        # Build graph
        self.graph_builder = KnowledgeGraphBuilder(data)
        self.graph = self.graph_builder.build_homogeneous_graph()
        
        self.num_students = len(data['students'])
        self.num_courses = len(data['courses'])
        
        # Build model
        self.model = self._build_model()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        # Prepare training data
        self._prepare_training_data()
    
    def _build_model(self):
        """Build the specified model"""
        if self.model_type == 'gcn':
            in_channels = self.graph.x.size(1)
            return GCNRecommender(in_channels, self.embedding_dim, self.num_layers)
        
        elif self.model_type == 'lightgcn':
            return LightGCNRecommender(
                self.num_students, self.num_courses, 
                self.embedding_dim, self.num_layers
            )
        
        elif self.model_type == 'graphsage':
            in_channels = self.graph.x.size(1)
            return GraphSAGERecommender(in_channels, self.embedding_dim, self.num_layers)
        
        elif self.model_type == 'kgat':
            return KGATRecommender(
                self.num_students, self.num_courses,
                self.embedding_dim, self.num_layers
            )
        
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def _prepare_training_data(self):
        """Prepare train/test split"""
        enrollments = self.data['enrollments']
        
        # Positive samples
        pos_samples = [(e['student_id'], e['course_id']) for e in enrollments]
        
        # Create user-item matrix for negative sampling
        self.user_items = defaultdict(set)
        for sid, cid in pos_samples:
            self.user_items[sid].add(cid)
        
        # Train/test split
        train_samples, test_samples = train_test_split(
            pos_samples, test_size=0.2, random_state=42
        )
        
        self.train_samples = train_samples
        self.test_samples = test_samples
    
    def _negative_sampling(self, user_ids: List[int], num_neg: int = 1) -> List[Tuple[int, int]]:
        """Sample negative items for users"""
        neg_samples = []
        for uid in user_ids:
            user_pos_items = self.user_items[uid]
            for _ in range(num_neg):
                neg_item = np.random.randint(0, self.num_courses)
                while neg_item in user_pos_items:
                    neg_item = np.random.randint(0, self.num_courses)
                neg_samples.append((uid, neg_item))
        return neg_samples
    
    def train_epoch(self, batch_size: int = 256):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0
        
        # Shuffle training samples
        train_samples = self.train_samples.copy()
        np.random.shuffle(train_samples)
        
        for i in range(0, len(train_samples), batch_size):
            batch = train_samples[i:i + batch_size]
            user_ids = [s[0] for s in batch]
            pos_items = [s[1] for s in batch]
            
            # Negative sampling
            neg_samples = self._negative_sampling(user_ids, num_neg=1)
            neg_items = [s[1] for s in neg_samples]
            
            # Forward pass
            if self.model_type in ['lightgcn', 'kgat']:
                user_emb, item_emb = self.model(self.graph.edge_index)
                
                users = user_emb[user_ids]
                pos_items_emb = item_emb[pos_items]
                neg_items_emb = item_emb[neg_items]
                
            else:  # GCN, GraphSAGE
                embeddings = self.model(self.graph.x, self.graph.edge_index)
                
                users = embeddings[user_ids]
                pos_items_emb = embeddings[[p + self.num_students for p in pos_items]]
                neg_items_emb = embeddings[[n + self.num_students for n in neg_items]]
            
            # BPR loss
            pos_scores = (users * pos_items_emb).sum(dim=1)
            neg_scores = (users * neg_items_emb).sum(dim=1)
            
            loss = -F.logsigmoid(pos_scores - neg_scores).mean()
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
        
        return total_loss / num_batches
    
    def evaluate(self, ks: List[int] = [1, 3, 10]) -> Dict[str, float]:
        """Evaluate on test set for multiple k values"""
        self.model.eval()
        
        with torch.no_grad():
            if self.model_type in ['lightgcn', 'kgat']:
                user_emb, item_emb = self.model(self.graph.edge_index)
            else:
                embeddings = self.model(self.graph.x, self.graph.edge_index)
                user_emb = embeddings[:self.num_students]
                item_emb = embeddings[self.num_students:]
        
        test_users = list(set([s[0] for s in self.test_samples]))
        metrics = {f'hit@{k}': [] for k in ks}
        metrics.update({f'ndcg@{k}': [] for k in ks})
        mrrs = []

        for uid in test_users:
            test_items = [s[1] for s in self.test_samples if s[0] == uid]
            if not test_items:
                continue
            
            user_vec = user_emb[uid]
            scores = torch.matmul(item_emb, user_vec)
            
            train_items = list(self.user_items[uid])
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
                
                # Hit@k
                hit = int(len(set(top_k_items) & set(test_items)) > 0)
                metrics[f'hit@{k}'].append(hit)
                
                # NDCG@k
                if k > 1:
                    relevance = [1 if item in test_items else 0 for item in top_k_items]
                    ideal_relevance = [1] * min(k, len(test_items)) + [0] * (k - len(test_items))
                    if sum(ideal_relevance) > 0:
                        metrics[f'ndcg@{k}'].append(ndcg_score([ideal_relevance], [relevance]))
                else:
                    metrics[f'ndcg@{k}'].append(0.0)

        results = {'mrr': np.mean(mrrs)}
        for k in ks:
            results[f'hit@{k}'] = np.mean(metrics[f'hit@{k}'])
            results[f'ndcg@{k}'] = np.mean(metrics[f'ndcg@{k}'])
        return results
    
    def recommend_courses(self, student_id: int, k: int = 10) -> List[Dict]:
        """Recommend top-k courses for a student"""
        self.model.eval()
        
        with torch.no_grad():
            if self.model_type in ['lightgcn', 'kgat']:
                user_emb, item_emb = self.model(self.graph.edge_index)
            else:
                embeddings = self.model(self.graph.x, self.graph.edge_index)
                user_emb = embeddings[:self.num_students]
                item_emb = embeddings[self.num_students:]
            
            # Compute scores
            user_vec = user_emb[student_id]
            scores = torch.matmul(item_emb, user_vec)
            
            # Remove already enrolled courses
            enrolled_courses = list(self.user_items[student_id])
            scores[enrolled_courses] = -float('inf')
            
            # Top-k
            top_scores, top_k_items = torch.topk(scores, k)
            top_k_items = top_k_items.cpu().numpy()
            top_scores = top_scores.cpu().numpy()
        
        # Format recommendations
        recommendations = []
        for idx, (course_id, score) in enumerate(zip(top_k_items, top_scores)):
            course_info = self.data['courses'][course_id]
            recommendations.append({
                'rank': idx + 1,
                'course_id': int(course_id),
                'course_name': course_info['course_name'],
                'major_id': course_info['major_id'],
                'level': course_info['level'],
                'score': float(score),
                'credits': course_info['credits']
            })
        return recommendations