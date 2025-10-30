import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional

from data_generator import CourseDataGenerator
from recommendation_system import CourseRecommendationSystem

# ==================== Main Usage Example ====================

def main():
    """Example usage of the course recommendation system"""
    
    print("=" * 60)
    print("GNN-Based Course Recommendation System")
    print("=" * 60)
    
    # Step 1: Generate dataset
    print("\n[1] Generating synthetic course dataset...")
    generator = CourseDataGenerator()
    data = generator.generate_simple_dataset(
        num_students=200,
        num_courses=50,
        num_majors=5,
        avg_courses_per_student=8
    )
    
    print(f"  - Students: {len(data['students'])}")
    print(f"  - Courses: {len(data['courses'])}")
    print(f"  - Enrollments: {len(data['enrollments'])}")
    print(f"  - Prerequisites: {len(data['prerequisites'])}")
    
    # Save dataset (optional)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "data\course_data.json")

    # Ensure the directory exists before writing
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    generator.save_dataset(data, file_path)
    print(f"  - Dataset saved to '{file_path}'")
    
    # Step 2: Test different models
    models_to_test = ['lightgcn', 'gcn', 'graphsage', 'kgat']
    results = {}
    
    for model_type in models_to_test:
        print(f"\n[2] Training {model_type.upper()} model...")
        
        # Initialize system
        rec_system = CourseRecommendationSystem(
            data, 
            model_type=model_type,
            embedding_dim=64,
            num_layers=3
        )
        
        # Training
        num_epochs = 50
        for epoch in range(num_epochs):
            loss = rec_system.train_epoch(batch_size=256)
            
            if (epoch + 1) % 10 == 0:
                metrics = rec_system.evaluate(k=10)
                print(f"  Epoch {epoch+1}/{num_epochs} - Loss: {loss:.4f} - "
                      f"P@10: {metrics['precision@k']:.4f} - "
                      f"R@10: {metrics['recall@k']:.4f} - "
                      f"NDCG@10: {metrics['ndcg@k']:.4f}")
        
        # Final evaluation
        final_metrics = rec_system.evaluate(k=10)
        results[model_type] = final_metrics
        
        # Step 3: Generate recommendations for a sample student
        if model_type == 'lightgcn':  # Show example for one model
            print(f"\n[3] Sample Recommendations ({model_type.upper()}):")
            student_id = 0
            student_info = data['students'][student_id]
            print(f"\n  Student {student_id}:")
            print(f"    Major: {student_info['major_id']}, Semester: {student_info['semester']}, GPA: {student_info['gpa']:.2f}")
            
            recommendations = rec_system.recommend_courses(student_id, k=10)
            print(f"\n  Top 10 Recommended Courses:")
            for rec in recommendations:
                print(f"    {rec['rank']}. {rec['course_name']} (Level {rec['level']}, "
                      f"Major {rec['major_id']}, Score: {rec['score']:.4f})")
    
    # Step 4: Compare models
    print("\n" + "=" * 60)
    print("[4] Model Comparison Results:")
    print("=" * 60)
    print(f"{'Model':<15} {'Precision@10':<15} {'Recall@10':<15} {'NDCG@10':<15}")
    print("-" * 60)
    for model_type, metrics in results.items():
        print(f"{model_type.upper():<15} {metrics['precision@k']:<15.4f} "
              f"{metrics['recall@k']:<15.4f} {metrics['ndcg@k']:<15.4f}")
    
    print("\n" + "=" * 60)
    print("System ready for deployment!")
    print("You can now:")
    print("  - Load custom datasets using CourseDataGenerator.load_dataset()")
    print("  - Change models by specifying model_type parameter")
    print("  - Generate recommendations using recommend_courses()")
    print("=" * 60)


if __name__ == "__main__":
    main()


# ==================== Additional Utilities ====================

class DatasetLoader:
    """Load various dataset formats"""
    
    @staticmethod
    def load_from_csv(
        students_csv: str,
        courses_csv: str,
        enrollments_csv: str,
        prerequisites_csv: Optional[str] = None
    ) -> Dict:
        """
        Load dataset from CSV files
        
        Expected CSV formats:
        - students.csv: student_id, major_id, semester, gpa
        - courses.csv: course_id, course_name, major_id, level, credits
        - enrollments.csv: student_id, course_id, grade, rating
        - prerequisites.csv: course_id, prerequisite_id
        """
        students_df = pd.read_csv(students_csv)
        courses_df = pd.read_csv(courses_csv)
        enrollments_df = pd.read_csv(enrollments_csv)
        
        # Convert to dict format
        students = students_df.to_dict('records')
        courses = courses_df.to_dict('records')
        enrollments = enrollments_df.to_dict('records')
        
        prerequisites = []
        if prerequisites_csv:
            prerequisites_df = pd.read_csv(prerequisites_csv)
            prerequisites = prerequisites_df.to_dict('records')
        
        # Generate features
        num_majors = students_df['major_id'].max() + 1
        
        # Student features
        student_features = []
        for _, student in students_df.iterrows():
            major_onehot = [0] * num_majors
            major_onehot[student['major_id']] = 1
            features = major_onehot + [
                student['semester'] / 8.0,
                student['gpa'] / 4.0
            ]
            student_features.append(features)
        
        # Course features
        course_features = []
        for _, course in courses_df.iterrows():
            major_onehot = [0] * num_majors
            major_onehot[course['major_id']] = 1
            features = major_onehot + [
                course['level'] / 4.0,
                course['credits'] / 4.0
            ]
            course_features.append(features)
        
        return {
            'students': students,
            'courses': courses,
            'enrollments': enrollments,
            'prerequisites': prerequisites,
            'student_features': np.array(student_features, dtype=np.float32),
            'course_features': np.array(course_features, dtype=np.float32)
        }
    
    @staticmethod
    def export_recommendations_to_csv(
        recommendations: List[Dict],
        student_id: int,
        filepath: str = 'recommendations.csv'
    ):
        """Export recommendations to CSV"""
        df = pd.DataFrame(recommendations)
        df['student_id'] = student_id
        df.to_csv(filepath, index=False)
        print(f"Recommendations saved to {filepath}")


class ModelEvaluator:
    """Advanced evaluation and analysis tools"""
    
    @staticmethod
    def evaluate_all_metrics(
        rec_system: CourseRecommendationSystem,
        k_values: List[int] = [5, 10, 20]
    ) -> pd.DataFrame:
        """Evaluate at multiple K values"""
        results = []
        
        for k in k_values:
            metrics = rec_system.evaluate(k=k)
            results.append({
                'K': k,
                'Precision': metrics['precision@k'],
                'Recall': metrics['recall@k'],
                'NDCG': metrics['ndcg@k']
            })
        
        return pd.DataFrame(results)
    
    @staticmethod
    def analyze_recommendations_diversity(
        recommendations: List[Dict]
    ) -> Dict[str, float]:
        """Analyze diversity of recommendations"""
        majors = [r['major_id'] for r in recommendations]
        levels = [r['level'] for r in recommendations]
        
        unique_majors = len(set(majors))
        unique_levels = len(set(levels))
        
        return {
            'unique_majors': unique_majors,
            'unique_levels': unique_levels,
            'major_entropy': -sum([majors.count(m)/len(majors) * np.log(majors.count(m)/len(majors)) 
                                   for m in set(majors)]),
            'level_entropy': -sum([levels.count(l)/len(levels) * np.log(levels.count(l)/len(levels)) 
                                   for l in set(levels)])
        }
    
    @staticmethod
    def compare_models_comprehensive(
        data: Dict,
        models: List[str] = ['lightgcn', 'gcn', 'graphsage', 'kgat'],
        num_epochs: int = 50
    ) -> pd.DataFrame:
        """Comprehensive model comparison"""
        results = []
        
        for model_type in models:
            print(f"\nTraining {model_type.upper()}...")
            rec_system = CourseRecommendationSystem(
                data, model_type=model_type,
                embedding_dim=64, num_layers=3
            )
            
            # Training time
            import time
            start_time = time.time()
            
            for epoch in range(num_epochs):
                loss = rec_system.train_epoch()
            
            training_time = time.time() - start_time
            
            # Evaluation
            metrics = rec_system.evaluate(k=10)
            
            results.append({
                'Model': model_type.upper(),
                'Training Time (s)': training_time,
                'Precision@10': metrics['precision@k'],
                'Recall@10': metrics['recall@k'],
                'NDCG@10': metrics['ndcg@k']
            })
        
        return pd.DataFrame(results)


class RecommendationExplainer:
    """Explain why courses are recommended"""
    
    def __init__(self, rec_system: CourseRecommendationSystem):
        self.rec_system = rec_system
        self.data = rec_system.data
    
    def explain_recommendation(
        self,
        student_id: int,
        course_id: int
    ) -> Dict[str, any]:
        """Explain why a course is recommended"""
        student = self.data['students'][student_id]
        course = self.data['courses'][course_id]
        
        # Find similar students who took this course
        similar_students = []
        for enroll in self.data['enrollments']:
            if enroll['course_id'] == course_id:
                other_student = self.data['students'][enroll['student_id']]
                if other_student['major_id'] == student['major_id']:
                    similar_students.append(other_student)
        
        # Find prerequisites completed
        completed_courses = list(self.rec_system.user_items[student_id])
        prerequisites = [
            p['prerequisite_id'] for p in self.data['prerequisites']
            if p['course_id'] == course_id
        ]
        completed_prereqs = [p for p in prerequisites if p in completed_courses]
        
        # Co-enrollment patterns
        colearned_courses = []
        for other_enroll in self.data['enrollments']:
            if (other_enroll['course_id'] == course_id and 
                other_enroll['student_id'] != student_id):
                other_student_courses = [
                    e['course_id'] for e in self.data['enrollments']
                    if e['student_id'] == other_enroll['student_id']
                ]
                colearned_courses.extend(
                    [c for c in other_student_courses if c in completed_courses]
                )
        
        return {
            'student_info': student,
            'course_info': course,
            'same_major': student['major_id'] == course['major_id'],
            'appropriate_level': course['level'] <= student['semester'] // 2 + 1,
            'num_similar_students': len(similar_students),
            'prerequisites_completed': len(completed_prereqs),
            'total_prerequisites': len(prerequisites),
            'colearning_strength': len(colearned_courses)
        }
    
    def generate_explanation_text(
        self,
        student_id: int,
        course_id: int
    ) -> str:
        """Generate human-readable explanation"""
        explanation = self.explain_recommendation(student_id, course_id)
        
        text = f"Recommendation Explanation for {explanation['course_info']['course_name']}:\n\n"
        
        reasons = []
        
        if explanation['same_major']:
            reasons.append(f"✓ This course is in your major (Major {explanation['student_info']['major_id']})")
        
        if explanation['appropriate_level']:
            reasons.append(f"✓ Course level ({explanation['course_info']['level']}) matches your progression")
        
        if explanation['prerequisites_completed'] > 0:
            reasons.append(
                f"✓ You've completed {explanation['prerequisites_completed']}/{explanation['total_prerequisites']} "
                f"prerequisites"
            )
        
        if explanation['num_similar_students'] > 0:
            reasons.append(
                f"✓ {explanation['num_similar_students']} students with similar profile took this course"
            )
        
        if explanation['colearning_strength'] > 0:
            reasons.append(
                f"✓ Strong co-learning pattern with {explanation['colearning_strength']} of your completed courses"
            )
        
        text += "\n".join(reasons)
        
        return text


# ==================== Advanced Training Utilities ====================

class AdvancedTrainer:
    """Advanced training utilities with callbacks and monitoring"""
    
    def __init__(self, rec_system: CourseRecommendationSystem):
        self.rec_system = rec_system
        self.history = {
            'train_loss': [],
            'precision': [],
            'recall': [],
            'ndcg': []
        }
    
    def train_with_validation(
        self,
        num_epochs: int = 100,
        batch_size: int = 256,
        early_stopping_patience: int = 10,
        k: int = 10
    ):
        """Train with early stopping and validation monitoring"""
        best_ndcg = 0
        patience_counter = 0
        
        print(f"\nTraining {self.rec_system.model_type.upper()} model...")
        print("-" * 60)
        
        for epoch in range(num_epochs):
            # Training
            train_loss = self.rec_system.train_epoch(batch_size)
            self.history['train_loss'].append(train_loss)
            
            # Validation
            metrics = self.rec_system.evaluate(k=k)
            self.history['precision'].append(metrics['precision@k'])
            self.history['recall'].append(metrics['recall@k'])
            self.history['ndcg'].append(metrics['ndcg@k'])
            
            # Print progress
            if (epoch + 1) % 10 == 0 or epoch == 0:
                print(f"Epoch {epoch+1:3d}/{num_epochs} | "
                      f"Loss: {train_loss:.4f} | "
                      f"P@{k}: {metrics['precision@k']:.4f} | "
                      f"R@{k}: {metrics['recall@k']:.4f} | "
                      f"NDCG@{k}: {metrics['ndcg@k']:.4f}")
            
            # Early stopping
            if metrics['ndcg@k'] > best_ndcg:
                best_ndcg = metrics['ndcg@k']
                patience_counter = 0
                # Save best model
                self.best_model_state = {
                    k: v.cpu().clone() for k, v in self.rec_system.model.state_dict().items()
                }
            else:
                patience_counter += 1
            
            if patience_counter >= early_stopping_patience:
                print(f"\nEarly stopping at epoch {epoch+1}")
                print(f"Best NDCG@{k}: {best_ndcg:.4f}")
                break
        
        # Restore best model
        if hasattr(self, 'best_model_state'):
            self.rec_system.model.load_state_dict(self.best_model_state)
        
        print("-" * 60)
        print(f"Training completed! Best NDCG@{k}: {best_ndcg:.4f}\n")
        
        return self.history
    
    def plot_training_history(self, save_path: str = 'training_history.png'):
        """Plot training history (requires matplotlib)"""
        try:
            import matplotlib.pyplot as plt
            
            fig, axes = plt.subplots(2, 2, figsize=(12, 8))
            
            axes[0, 0].plot(self.history['train_loss'])
            axes[0, 0].set_title('Training Loss')
            axes[0, 0].set_xlabel('Epoch')
            axes[0, 0].set_ylabel('Loss')
            
            axes[0, 1].plot(self.history['precision'])
            axes[0, 1].set_title('Precision@K')
            axes[0, 1].set_xlabel('Epoch')
            axes[0, 1].set_ylabel('Precision')
            
            axes[1, 0].plot(self.history['recall'])
            axes[1, 0].set_title('Recall@K')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('Recall')
            
            axes[1, 1].plot(self.history['ndcg'])
            axes[1, 1].set_title('NDCG@K')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('NDCG')
            
            plt.tight_layout()
            plt.savefig(save_path)
            print(f"Training history plot saved to {save_path}")
            
        except ImportError:
            print("matplotlib not installed. Install it to plot training history.")


# ==================== Example: Custom Dataset Usage ====================

def example_custom_dataset():
    """Example of using custom dataset"""
    
    print("\n" + "=" * 60)
    print("Example: Loading Custom Dataset")
    print("=" * 60)
    
    # Example: Create sample CSV files
    print("\n[1] Creating sample CSV files...")
    
    # Students
    students_data = {
        'student_id': range(100),
        'major_id': [i % 3 for i in range(100)],
        'semester': [np.random.randint(1, 9) for _ in range(100)],
        'gpa': [np.random.uniform(2.0, 4.0) for _ in range(100)]
    }
    pd.DataFrame(students_data).to_csv('students.csv', index=False)
    
    # Courses
    courses_data = {
        'course_id': range(30),
        'course_name': [f'Course_{i}' for i in range(30)],
        'major_id': [i % 3 for i in range(30)],
        'level': [(i // 3) % 4 + 1 for i in range(30)],
        'credits': [3] * 30
    }
    pd.DataFrame(courses_data).to_csv('courses.csv', index=False)
    
    # Enrollments
    enrollments_data = []
    for sid in range(100):
        num_courses = np.random.randint(5, 12)
        courses = np.random.choice(30, num_courses, replace=False)
        for cid in courses:
            enrollments_data.append({
                'student_id': sid,
                'course_id': int(cid),
                'grade': np.random.uniform(2.5, 4.0),
                'rating': 1.0
            })
    pd.DataFrame(enrollments_data).to_csv('enrollments.csv', index=False)
    
    print("  ✓ CSV files created")
    
    # Load dataset
    print("\n[2] Loading dataset from CSV files...")
    loader = DatasetLoader()
    data = loader.load_from_csv(
        'students.csv',
        'courses.csv',
        'enrollments.csv'
    )
    
    print(f"  ✓ Loaded {len(data['students'])} students")
    print(f"  ✓ Loaded {len(data['courses'])} courses")
    print(f"  ✓ Loaded {len(data['enrollments'])} enrollments")
    
    # Train model
    print("\n[3] Training model...")
    rec_system = CourseRecommendationSystem(
        data,
        model_type='lightgcn',
        embedding_dim=64,
        num_layers=3
    )
    
    trainer = AdvancedTrainer(rec_system)
    history = trainer.train_with_validation(
        num_epochs=50,
        early_stopping_patience=10
    )
    
    # Get recommendations with explanations
    print("\n[4] Generating recommendations with explanations...")
    student_id = 0
    recommendations = rec_system.recommend_courses(student_id, k=5)
    
    explainer = RecommendationExplainer(rec_system)
    
    print(f"\nTop 5 Recommendations for Student {student_id}:")
    print("-" * 60)
    for rec in recommendations[:3]:  # Show top 3 with explanations
        print(f"\n{rec['rank']}. {rec['course_name']}")
        print(explainer.generate_explanation_text(student_id, rec['course_id']))
    
    # Export recommendations
    print("\n[5] Exporting recommendations...")
    loader.export_recommendations_to_csv(recommendations, student_id)
    
    print("\n" + "=" * 60)
    print("Custom dataset example completed!")
    print("=" * 60)


# ==================== Quick Start Guide ====================

def quick_start_guide():
    """Print quick start guide"""
    guide = """
    ╔══════════════════════════════════════════════════════════════╗
    ║         GNN Course Recommendation System - Quick Start       ║
    ╚══════════════════════════════════════════════════════════════╝
    
    1. GENERATE/LOAD DATA:
       # Generate synthetic data
       generator = CourseDataGenerator()
       data = generator.generate_simple_dataset()
       
       # OR load from CSV
       loader = DatasetLoader()
       data = loader.load_from_csv('students.csv', 'courses.csv', 'enrollments.csv')
    
    2. CREATE RECOMMENDATION SYSTEM:
       rec_system = CourseRecommendationSystem(
           data, 
           model_type='lightgcn',  # Options: 'lightgcn', 'gcn', 'graphsage', 'kgat'
           embedding_dim=64,
           num_layers=3
       )
    
    3. TRAIN MODEL:
       # Simple training
       for epoch in range(50):
           loss = rec_system.train_epoch()
       
       # OR advanced training with early stopping
       trainer = AdvancedTrainer(rec_system)
       trainer.train_with_validation(num_epochs=100, early_stopping_patience=10)
    
    4. EVALUATE:
       metrics = rec_system.evaluate(k=10)
       print(f"Precision@10: {metrics['precision@k']:.4f}")
    
    5. GET RECOMMENDATIONS:
       recommendations = rec_system.recommend_courses(student_id=0, k=10)
       for rec in recommendations:
           print(f"{rec['rank']}. {rec['course_name']} (Score: {rec['score']:.4f})")
    
    6. EXPLAIN RECOMMENDATIONS:
       explainer = RecommendationExplainer(rec_system)
       explanation = explainer.generate_explanation_text(student_id=0, course_id=5)
       print(explanation)
    
    7. COMPARE MODELS:
       evaluator = ModelEvaluator()
       comparison = evaluator.compare_models_comprehensive(
           data, 
           models=['lightgcn', 'gcn', 'graphsage', 'kgat']
       )
       print(comparison)
    
    ══════════════════════════════════════════════════════════════
    For more examples, run: example_custom_dataset()
    ══════════════════════════════════════════════════════════════
    """
    print(guide)


if __name__ == "__main__":
    # Run main demo
    main()
    
    # Uncomment to see custom dataset example
    # example_custom_dataset()
    
    # Uncomment to see quick start guide
    # quick_start_guide()