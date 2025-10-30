import os

from data_generator import CourseDataGenerator
from recommendation_system import CourseRecommendationSystem

NUM_EPOCHS = 10
BATCH_SIZE = 256
k_list = [1, 3, 5]
models_list = ['lightgcn', 'gcn', 'graphsage', 'kgat']
EMBEDDING_DIM = 64
NUM_LAYERS = 3
EVAL_INTERVAL = 10
TOP_K = 10

# Recommendation System metrics: MRR, Hit@k, nDCG@k
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
    results = {}
    
    for model_type in models_list:
        print(f"\n[2] Training {model_type.upper()} model...")
        
        # Initialize system
        rec_system = CourseRecommendationSystem(
            data, 
            model_type=model_type,
            embedding_dim=EMBEDDING_DIM,
            num_layers=NUM_LAYERS
        )
        
        # Training
        num_epochs = NUM_EPOCHS
        for epoch in range(num_epochs):
            loss = rec_system.train_epoch(batch_size=BATCH_SIZE)
            
            if (epoch + 1) % EVAL_INTERVAL == 0:
                metrics = rec_system.evaluate(ks=k_list)
                
                print(f"  Epoch {epoch+1}/{num_epochs} - Loss: {loss:.4f} - "
                      f"MRR: {metrics['mrr']:.4f}")
                for k in k_list:
                    print(f"    Hit@{k}: {metrics[f'hit@{k}']:.4f} - NDCG@{k}: {metrics[f'ndcg@{k}']:.4f}")

        # Final evaluation
        final_metrics = rec_system.evaluate(ks=k_list)
        results[model_type] = final_metrics
        
        # Step 3: Generate recommendations for a sample student
        if model_type == 'lightgcn':  # Show example for one model
            print(f"\n[3] Sample Recommendations ({model_type.upper()}):")
            student_id = 0
            student_info = data['students'][student_id]
            print(f"\n  Student {student_id}:")
            print(f"    Major: {student_info['major_id']}, Semester: {student_info['semester']}, GPA: {student_info['gpa']:.2f}")
            
            recommendations = rec_system.recommend_courses(student_id, k=TOP_K)
            print(f"\n  Top {TOP_K} Recommended Courses:")
            for rec in recommendations:
                print(f"    {rec['rank']}. {rec['course_name']} \t(Level {rec['level']}, "
                      f"Major {rec['major_id']}, Score: {rec['score']:.4f})")
    
    # Step 4: Compare models
    print("\n" + "=" * 60)
    print("[4] Model Comparison Results:")
    print("=" * 60)
    print(f"{'Model':<15} {'MRR':<10} " + " ".join([f"Hit@{k:<6} NDCG@{k:<6}" for k in k_list]))
    print("-" * 60)
    for model_type, metrics in results.items():
        row = f"{model_type.upper():<15} {metrics['mrr']:<10.4f} "
        for k in k_list:
            row += f"{metrics[f'hit@{k}']:<10.6f} {metrics[f'ndcg@{k}']:<10.6f} "
        print(row)
    
    print("\n" + "=" * 60)
    print("System ready for deployment!")
    print("You can now:")
    print("  - Load custom datasets using CourseDataGenerator.load_dataset()")
    print("  - Change models by specifying model_type parameter")
    print("  - Generate recommendations using recommend_courses()")
    print("=" * 60)

if __name__ == "__main__":
    main()