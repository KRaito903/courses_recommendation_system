import numpy as np
from typing import Dict
import json

def convert_numpy_types(obj):
    """Recursively convert numpy types to Python native types"""
    if isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    return obj

class CourseDataGenerator:
    """Generate synthetic course recommendation dataset"""
    @staticmethod
    def generate_simple_dataset(
        num_students: int = 200,
        num_courses: int = 50,
        num_majors: int = 5,
        avg_courses_per_student: int = 8
    ) -> Dict:
        """Generate a simple synthetic dataset"""
        np.random.seed(42)
        
        # Generate courses
        courses = []
        course_features = []
        for i in range(num_courses):
            major_id = int(i % num_majors)
            level = int((i // num_majors) % 4 + 1)  # Course level 1-4
            credits = int(np.random.choice([3, 4]))
            courses.append({
                'course_id': int(i),
                'course_name': f'Course_{i}',
                'major_id': major_id,
                'level': level,
                'credits': credits,
            })
            # Feature: [major_onehot, level, credits]
            major_onehot = [0] * num_majors
            major_onehot[major_id] = 1
            course_features.append(major_onehot + [level / 4.0, credits / 4.0])
        
        # Generate students
        students = []
        student_features = []
        for i in range(num_students):
            major_id = int(i % num_majors)
            semester = int(np.random.randint(1, 9))
            gpa = float(np.random.uniform(2.0, 4.0))
            students.append({
                'student_id': int(i),
                'major_id': major_id,
                'semester': semester,
                'gpa': gpa
            })
            # Feature: [major_onehot, semester, gpa]
            major_onehot = [0] * num_majors
            major_onehot[major_id] = 1
            student_features.append(major_onehot + [semester / 8.0, gpa / 4.0])
        
        # Generate enrollments (student-course interactions)
        enrollments = []
        for student in students:
            sid = student['student_id']
            major_id = student['major_id']
            semester = student['semester']
            
            # Students take courses from their major and prerequisites
            available_courses = [c for c in courses if c['major_id'] == major_id and c['level'] <= semester // 2 + 1]
            num_enrolled = min(avg_courses_per_student, len(available_courses))
            
            enrolled_courses = np.random.choice(
                [c['course_id'] for c in available_courses],
                size=num_enrolled,
                replace=False
            )
            
            for cid in enrolled_courses:
                grade = float(np.random.uniform(2.5, 4.0))  # Grade for the course
                enrollments.append({
                    'student_id': int(sid),
                    'course_id': int(cid),
                    'grade': grade,
                    'rating': 1.0  # Binary: enrolled=1
                })
        
        # Generate course prerequisites
        prerequisites = []
        for i in range(num_courses):
            if courses[i]['level'] > 1:
                # Find potential prerequisites
                potential_prereqs = [
                    c['course_id'] for c in courses 
                    if c['major_id'] == courses[i]['major_id'] 
                    and c['level'] < courses[i]['level']
                ]
                if potential_prereqs:
                    num_prereqs = np.random.randint(1, min(3, len(potential_prereqs) + 1))
                    prereqs = np.random.choice(potential_prereqs, size=num_prereqs, replace=False)
                    for prereq_id in prereqs:
                        prerequisites.append({
                            'course_id': int(i),
                            'prerequisite_id': int(prereq_id)
                        })
        
        return {
            'students': students,
            'courses': courses,
            'enrollments': enrollments,
            'prerequisites': prerequisites,
            'student_features': np.array(student_features, dtype=np.float32),
            'course_features': np.array(course_features, dtype=np.float32)
        }
    
    @staticmethod
    def save_dataset(data: Dict, filepath: str = 'course_data.json'):
        """Save dataset to JSON"""
        save_data = {k: v for k, v in data.items() if k not in ['student_features', 'course_features']}
        save_data['student_features'] = data['student_features'].tolist()
        save_data['course_features'] = data['course_features'].tolist()
        
        # Convert all numpy types to Python native types
        save_data = convert_numpy_types(save_data)
        
        with open(filepath, 'w') as f:
            json.dump(save_data, f, indent=2)
    
    @staticmethod
    def load_dataset(filepath: str = 'course_data.json') -> Dict:
        """Load dataset from JSON"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        data['student_features'] = np.array(data['student_features'], dtype=np.float32)
        data['course_features'] = np.array(data['course_features'], dtype=np.float32)
        return data