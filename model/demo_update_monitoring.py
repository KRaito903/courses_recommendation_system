from data_generator import CourseDataGenerator
from recommendation_system import CourseRecommendationSystem
from additional_functions import UpdateMonitor
from graph_builder import KnowledgeGraphBuilder
from models.graphsage import GraphSAGERecommender

def demo_update_monitoring():
    # Load initial data
    generator = CourseDataGenerator()
    initial_data = generator.generate_data(
        num_students=100,
        num_courses=50,
        average_courses_per_student=10
    )
    
    # Initialize recommendation system with initial data
    recommender = CourseRecommendationSystem(initial_data, model_type='graphsage', 
                                           embedding_dim=64, num_layers=2)
    
    # Initialize update monitor
    update_monitor = UpdateMonitor(initial_data['enrollments'])
    
    # Train initial model
    print("\nTraining initial model...")
    recommender.train(num_epochs=5)
    
    # Generate some new enrollments
    def generate_new_enrollments(num_new):
        return [
            {
                'student_id': i % 100,  # Using existing students
                'course_id': f"CSC{str(i).zfill(5)}",  # Using existing courses
                'is_enrolled': 1,
                'weight': 1.0
            }
            for i in range(num_new)
        ]
    
    # Simulate adding batches of new enrollments
    for batch in range(3):
        new_enrollments = generate_new_enrollments(5)  # Add 5 new enrollments each time
        print(f"\nAdding batch {batch + 1} of new enrollments...")
        
        # Update the data with new enrollments
        initial_data['enrollments'].extend(new_enrollments)
        
        # Check if retraining is needed
        if update_monitor.add_enrollments(new_enrollments):
            print("Retraining threshold reached!")
            print(f"New enrollments: {update_monitor.new_enrollments_count}")
            print(f"Total enrollments: {update_monitor.initial_enrollment_count}")
            
            # Rebuild graph with updated data
            graph_builder = KnowledgeGraphBuilder(initial_data)
            graph = graph_builder.build_heterogeneous_graph()
            recommender.update_graph(graph)
            
            # Retrain the model
            print("Retraining model...")
            recommender.train(num_epochs=5)
            
            # Reset the update monitor
            update_monitor.reset()
        else:
            print("No retraining needed yet")
            print(f"New enrollments: {update_monitor.new_enrollments_count}")
            print(f"Total enrollments: {update_monitor.initial_enrollment_count}")

if __name__ == "__main__":
    demo_update_monitoring()