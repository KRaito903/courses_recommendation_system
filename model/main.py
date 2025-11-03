import os
import json
from data_generator import CourseDataGenerator
from recommendation_system import CourseRecommendationSystem

def load_config(config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(base_dir, "config", "default_config.json")
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found at {config_path}")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    # Convert string keys back to integers for COURSE_MAJORS_DICT
    config['COURSE_MAJORS_DICT'] = {int(k): v for k, v in config['COURSE_MAJORS_DICT'].items()}
    return config

def save_config(config, config_path=None):
    if config_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(base_dir, "config", "default_config.json")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)

IS_GENERATE_DATA = True

# Load configuration
config = load_config()

# Global variables from config
NUM_STUDENTS = config['NUM_STUDENTS']
NUM_COURSES = config['NUM_COURSES']
NUM_MAJORS = config['NUM_MAJORS']
COURSE_MAJORS_DICT = config['COURSE_MAJORS_DICT']
MAX_SEMESTER = config['MAX_SEMESTER']
SEMESTERS_LIST = config['SEMESTERS_LIST']
CREDITS_LIST = config['CREDITS_LIST']
CREDIT_SCALE = config['CREDIT_SCALE']
COURSE_PREFIXES = config['COURSE_PREFIXES']
GPA_SCALE = config['GPA_SCALE']
WEIGHT_VALUES = config['WEIGHT_VALUES']
ENROLLMENT_DICT = config['ENROLLMENT_DICT']
AVERAGE_COURSES_PER_STUDENT = config['AVERAGE_COURSES_PER_STUDENT']
NUM_EPOCHS = config['NUM_EPOCHS']
BATCH_SIZE = config['BATCH_SIZE']
EARLY_STOPPING_PATIENCE = config['EARLY_STOPPING_PATIENCE']
EARLY_STOPPING_MIN_DELTA = config['EARLY_STOPPING_MIN_DELTA']
k_list = config['k_list']
models_list = config['models_list']
EMBEDDING_DIM = config['EMBEDDING_DIM']
NUM_LAYERS = config['NUM_LAYERS']
EVAL_INTERVAL = config['EVAL_INTERVAL']
TOP_K = config['TOP_K']

# Recommendation System metrics: MRR, Hit@k, nDCG@k
def train_and_evaluate_models(data):
    """Train and evaluate all models in the models_list.
    
    Args:
        data (dict): The dataset containing students, courses, and enrollments
        
    Returns:
        dict: Dictionary containing evaluation metrics for each model
    """
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
        
        # Training with early stopping
        num_epochs = NUM_EPOCHS
        patience = EARLY_STOPPING_PATIENCE
        min_delta = EARLY_STOPPING_MIN_DELTA
        best_val_loss = float('inf')
        best_model_state = None
        patience_counter = 0
        
        for epoch in range(num_epochs):
            # Train epoch
            train_loss = rec_system.train_epoch(batch_size=BATCH_SIZE)
            
            # Compute validation loss
            val_metrics = rec_system.evaluate(ks=k_list, use_validation=True)
            val_loss = -val_metrics['mrr']  # Use negative MRR as validation loss
            
            if (epoch + 1) % EVAL_INTERVAL == 0:
                print(f"  Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f} - "
                      f"Val Loss: {val_loss:.4f} - Val MRR: {val_metrics['mrr']:.4f}")
                for k in k_list:
                    print(f"    Val Hit@{k}: {val_metrics[f'hit@{k}']:.4f} - "
                          f"Val NDCG@{k}: {val_metrics[f'ndcg@{k}']:.4f}")
            
            # Early stopping check
            if val_loss < best_val_loss - min_delta:
                best_val_loss = val_loss
                best_model_state = {
                    'model_state': rec_system.model.state_dict(),
                    'epoch': epoch + 1
                }
                patience_counter = 0
            else:
                patience_counter += 1
            
            if patience_counter >= patience:
                print(f"\n  Early stopping triggered at epoch {epoch+1}")
                print(f"  Best validation loss {-best_val_loss:.4f} was achieved at epoch {best_model_state['epoch']}")
                break
        
        # Restore best model
        if best_model_state is not None:
            rec_system.model.load_state_dict(best_model_state['model_state'])
        
        # Final evaluation
        final_metrics = rec_system.evaluate(ks=k_list, use_test=True)
        results[model_type] = final_metrics
    
    return results

def show_sample_recommendations(data, student_id: int, model_type: str ='lightgcn'):
    """Show sample recommendations for a student using the LightGCN model.
    
    Args:
        data (dict): The dataset containing students, courses, and enrollments
    """
    rec_system = CourseRecommendationSystem(
        data, 
        model_type=model_type,
        embedding_dim=EMBEDDING_DIM,
        num_layers=NUM_LAYERS
    )
    
    print(f"\n[3] Sample Recommendations ({model_type.upper()}):")
    student_info = data['students'][student_id]
    print(f"\n  Student {student_id}:")
    print(f"    Major: {student_info['student_major']}, Semester: {student_info['semester']}, GPA: {student_info['gpa']:.2f}")
    
    recommendations = rec_system.recommend_courses(student_id, k=TOP_K)
    print(f"\n  Top {TOP_K} Recommended Courses:")
    for rec in recommendations:
        print(f"    {rec['rank']}. {rec['course_name']} - {rec['course_id']}\t"
              f"(Semester: {rec['semester']}, Credit: {rec['credit']}, Major {rec['course_major']}.\tScore: {rec['score']:.4f})")

def print_model_comparison(results):
    """Print a comparison table of all model results.
    
    Args:
        results (dict): Dictionary containing evaluation metrics for each model
    """
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

def generate_and_save_dataset():
    """Generate synthetic dataset and save it to disk.
    
    Returns:
        dict: The generated dataset containing students, courses, and enrollments
    """
    print("\n[1] Generating synthetic course dataset...")
    generator = CourseDataGenerator()
    data = generator.generate_simple_dataset(
        num_students=NUM_STUDENTS,
        num_courses=NUM_COURSES,
        num_majors=NUM_MAJORS,
        course_majors_dict=COURSE_MAJORS_DICT,
        max_semester=MAX_SEMESTER,
        semesters_list=SEMESTERS_LIST,
        credits_list=CREDITS_LIST,
        credit_scale=CREDIT_SCALE,
        course_prefixes=COURSE_PREFIXES,
        gpa_scale=GPA_SCALE,
        weight_values=WEIGHT_VALUES,
        enrollment_dict=ENROLLMENT_DICT,
        avg_courses_per_student=AVERAGE_COURSES_PER_STUDENT
    )
    
    print(f"  - Students: {len(data['students'])}")
    print(f"  - Courses: {len(data['courses'])}")
    print(f"  - Enrollments: {len(data['enrollments'])}")
    
    # Save dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "data", "generated_real_data.json")

    # Ensure the directory exists before writing
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    generator.save_dataset(data, file_path)
    print(f"  - Dataset saved to '{file_path}'")
    
    return data

def main():  
    print("=" * 60)
    print("GNN-Based Course Recommendation System")
    print("=" * 60)
    
    # Step 1: Generate dataset if needed
    if IS_GENERATE_DATA:
        data = generate_and_save_dataset()
    else:
        # Load existing dataset
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, "data", "generated_real_data.json")
        generator = CourseDataGenerator()
        data = generator.load_dataset(file_path)
        print("\n[1] Loaded existing dataset")
        print(f"  - Students: {len(data['students'])}")
        print(f"  - Courses: {len(data['courses'])}")
        print(f"  - Enrollments: {len(data['enrollments'])}")
    
    # Step 2: Train and evaluate models
    # results = train_and_evaluate_models(data)
    
    # Step 3: Show sample recommendations
    # student_id = 4
    # show_sample_recommendations(data, student_id, model_type='lightgcn')

    # # print "will_enroll" courses of student 0 to verify
    # student_will_enroll = [e for e in data['enrollments'] if e['student_id'] == student_id and e['is_enrolled'] == 0]
    # print(f"\n  Student {student_id} 'will_enroll' courses:")
    # for e in student_will_enroll:
    #     print(f"    Course ID: {e['course_id']}")
    
    # Step 4: Compare models
    # print_model_comparison(results)
    
if __name__ == "__main__":
    main()