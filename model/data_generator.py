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
        num_majors: int = 9,
        course_majors_dict: Dict = {
                0: [0,0,0,0,0,0,0,0,0],
                1: [1,1,0,0,0,0,0,0,0],
                2: [0,0,1,0,0,0,0,0,0],
                3: [0,0,0,1,0,0,0,0,0],
                4: [0,0,0,0,1,0,0,0,0],
                5: [0,0,0,0,0,1,0,0,0],
                6: [0,0,0,0,0,0,1,0,0],
                7: [0,0,0,0,0,0,0,1,0],
                15: [1,1,0,0,0,1,0,0,0],
                27: [0,0,1,0,0,0,0,1,0]
            },
        max_semester: int = 12,
        semesters_list: list = [1,4,7,10],
        credits_list: list = [2, 4, 6],
        credit_scale: int = 6,
        course_prefixes: list = ['CSC', 'MTH', 'PHY'],
        gpa_scale: int = 10,
        weight_values: list = [0.0, 0.25, 0.5, 1.0],
        enrollment_dict: Dict = {
            'liked': 1.0,
            'disliked': -1.0,
            'will_enroll': 0.5
            },
        avg_courses_per_student: int = 8
    ) -> Dict:
        """Generate a simple synthetic dataset"""
        np.random.seed(42)
        
        # Generate students
        students = []
        student_features = []
        for i in range(num_students):
            student_major = int(i % num_majors)
            semester = int(np.random.choice(semesters_list))
            gpa = float(np.random.randint(1, gpa_scale + 1))

            students.append({
                'student_id': int(i),
                'student_major': student_major,
                'semester': semester,
                'gpa': gpa
            })
            # Feature: [major_onehot, semester, gpa]
            major_onehot = [0] * num_majors
            major_onehot[student_major] = 1
            student_features.append(major_onehot + [float(semester) / max_semester, gpa / gpa_scale])
        
        # Generate courses
        courses = []
        course_features = []
        course_majors = list(course_majors_dict.keys())
        for i in range(num_courses):
            course_code = np.random.choice(course_prefixes) + f"{i:05d}"
            course_major = int(np.random.choice(course_majors))
            semester = int(np.random.randint(1, max_semester + 1))
            credit = int(np.random.choice(credits_list))
            course_weight = list(np.random.choice(weight_values, size=num_majors))

            courses.append({
                'course_id': int(i),
                'course_name': f"Course {i}",
                'course_code': course_code,
                'course_major': course_major,
                'semester': semester,
                'credit': credit,
                'weight': course_weight
            })
            # Feature: [major_onehot, semester, credit, weight]
            major_onehot = course_majors_dict[course_major]
            course_features.append(major_onehot + [float(semester) / max_semester, float(credit) / credit_scale] + course_weight)

        # Generate enrollments (student-course interactions)
        enrollments = []
        for student in students:
            sid = student['student_id']
            student_major = student['student_major']
            student_semester = student['semester']
            
            # Students take courses from their major and prerequisites
            available_courses = [c for c in courses if c['semester'] <= student_semester]
            num_enrolled = min(avg_courses_per_student, len(available_courses))
            enrolled_courses = np.random.choice([c['course_id'] for c in available_courses], size=num_enrolled, replace=False)
            enrollment_list = list(enrollment_dict.keys())

            for cid in enrolled_courses:
                enrollment_type = np.random.choice(enrollment_list)
                enrollment_weight = float(enrollment_dict[enrollment_type])
                enrollments.append({
                    'student_id': sid,
                    'course_id': cid,
                    'type': enrollment_type,
                    'weight': enrollment_weight,
                    'is_enrolled': 0 if enrollment_type == 'will_enroll' else 1
                })
        
        return {
            'students': students,
            'courses': courses,
            'enrollments': enrollments,
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