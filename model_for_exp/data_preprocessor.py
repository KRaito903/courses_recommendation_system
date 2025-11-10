from typing import Dict, List
import numpy as np
from numpy.typing import NDArray
import json

ONEHOT_STUDENT_MAJOR = {
    "MMT hướng ATTT":   [1,0,0,0,0,0,0,0,0],
    "MMT":              [1,0,0,0,0,0,0,0,0],
    "HTTT":             [0,1,0,0,0,0,0,0,0],
    "KTPM":             [0,0,1,0,0,0,0,0,0],
    "KHMT hướng TTNT":  [0,0,0,1,0,0,0,0,0],
    "CNTThuc":          [0,0,0,0,1,0,0,0,0],
    "TGMT":             [0,0,0,0,0,1,0,0,0],
    "KHDL":             [0,0,0,0,0,0,1,0,0],
    "ATTT":             [0,0,0,0,0,0,0,1,0],
    "CNTTin":           [0,0,0,0,0,0,0,0,1]
}
MANYHOTS_COURSE_MAJOR = {
    "Cơ sở ngành":      [0,0,0,0,0,0,0,0,0],
    "Đại cương":        [0,0,0,0,0,0,0,0,0],
    "MMT hướng ATTT":   [1,1,0,0,0,0,0,0,0],
    "HTTT":             [0,0,1,0,0,0,0,0,0],
    "KTPM":             [0,0,0,1,0,0,0,0,0],
    "KHMT hướng TTNT":  [0,0,0,0,1,0,0,0,0],
    "CNTThuc":          [0,0,0,0,0,1,0,0,0],
    "TGMT":             [0,0,0,0,0,0,1,0,0],
    "KHDL":             [0,0,0,0,0,0,0,1,0],
    "HTTT/KHDL":        [0,0,1,0,0,0,0,1,0],
    "MMT hướng ATTT/CNTThuc": [1,1,0,0,0,1,0,0,0]
}
ENROLLMENT_WEIGHT = {
    'liked': 1.0,
    'disliked': -1.0,
    'will_enroll': 0.5
}

class DataPreprocessor:
    """Preprocess course recommendation dataset"""
    @staticmethod
    def preprocess_students(students: List[Dict], max_semester: int = 12, gpa_scale: float = 10.0) -> List[NDArray[np.float32]]:
        """
        Preprocess student data to extract features.
        Args:
            students (List[Dict]): List of student dictionaries.
                a student:
                    student_id: int
                    student_code: str
                    student_name: str
                    student_major_code: str in list ["MMT hướng ATTT", "MMT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "ATTT", "CNTTin"]
                    semester: int
                    gpa: float in range [0.0, 10.0]
                    image_url: str
        Returns:
            List[np.array(dtype=np.float32)]: List of student feature vectors.
                a student_feature:
                    student_id: int (keep original)
                    student_major_onehot: ONEHOT_STUDENT_MAJOR[student_major_code]
                    normalized_semester: int (normalized by max_semester)
                    normalized_gpa: float (normalized by gpa_scale)
        """
        student_features = []
        for student in students:
            major_onehot = ONEHOT_STUDENT_MAJOR.get(student['student_major_code'], [0]*9)
            
            normalized_semester = float(student['semester']) / max_semester
            normalized_gpa = float(student['gpa']) / gpa_scale
            
            feature_vector = np.array(major_onehot + [normalized_semester, normalized_gpa], dtype=np.float32)
            student_features.append(feature_vector)
        return student_features

    @staticmethod
    def preprocess_courses(courses: List[Dict], num_majors: int = 9, max_semester: int = 12, max_credit: int = 6) -> List[NDArray[np.float32]]:
        """
        Preprocess course data to extract features.
        Args:
            courses (List[Dict]): List of course dictionaries.
                a course:
                    course_id: int
                    course_code: str
                    course_name: str
                    course_major_code: str in list ["Cơ sở ngành", "Đại cương", "MMT hướng ATTT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "HTTT/KHDL", "MMT hướng ATTT/CNTThuc"]
                    semester: int
                    credit: int
                    weight: List[float] of length num_majors
        Returns:
            List[np.array(dtype=np.float32)]: List of course feature vectors.
                a course_feature:
                    course_id: int (keep original)
                    course_major_id: MANYHOTS_COURSE_MAJOR[course_major_code]
                    normalized_semester: int (normalized by max_semester)
                    normalized_credit: float (normalized by max_credit)
                    weight: List[float] (keep original)
        """
        course_features = []
        for course in courses:
            major_manyhot = MANYHOTS_COURSE_MAJOR.get(course['course_major_code'], [0]*num_majors)
            
            normalized_semester = float(course['semester']) / max_semester
            normalized_credit = float(course['credit']) / max_credit
            
            feature_vector = np.array(major_manyhot + [normalized_semester, normalized_credit] + course['weight'], dtype=np.float32)
            course_features.append(feature_vector)
        return course_features

    @staticmethod
    def preprocess_enrollments(enrollments: List[Dict]) -> List[Dict]:
        """
        Preprocess enrollment data to ensure correct format.
        Args:
            enrollments (List[Dict]): List of enrollment dictionaries.
                a enrollment:
                    student_id: int
                    course_id: int
                    type: str in ["liked", "disliked", "will_enroll"]
        Returns:
            List[Dict]: List of processed enrollment dictionaries.
                a processed_enrollment:
                    student_id: int (keep original)
                    course_id: int (keep original)
                    weight: ENROLLMENT_WEIGHT[type]
                    is_enrolled: int (1 if enrolled, 0 if will_enroll)
        """
        processed_enrollments = []
        for enrollment in enrollments:
            weight = ENROLLMENT_WEIGHT.get(enrollment['type'], 0.0)
            is_enrolled = 1 if enrollment['type'] != 'will_enroll' else 0
            
            processed_enrollment = {
                'student_id': enrollment['student_id'],
                'course_id': enrollment['course_id'],
                'weight': weight,
                'is_enrolled': is_enrolled
            }
            processed_enrollments.append(processed_enrollment)
        return processed_enrollments
    
    @staticmethod
    def preprocess_data(data: Dict, max_semester: int = 12, gpa_scale: float = 10.0, num_majors: int = 9,
                        is_save_json: bool = True,
                        preprocessed_filepath_prefix: str = './data/preprocessed-dataset') -> Dict:
        """
        Preprocess the entire dataset including students, courses, and enrollments.
        Args:
            data (Dict): The dataset containing students, courses, and enrollments
        Returns:
            Dict: The preprocessed dataset with updated features and enrollments
        """
        preprocessed_students = DataPreprocessor.preprocess_students(data['students'], max_semester, gpa_scale)
        preprocessed_courses = DataPreprocessor.preprocess_courses(data['courses'], num_majors, max_semester, max_credit=6)
        preprocessed_enrollments = DataPreprocessor.preprocess_enrollments(data['enrollments'])
        
        preprocessed_data = {
            'students': data['students'],
            'courses': data['courses'],
            'enrollments': preprocessed_enrollments,
            'student_features': np.array(preprocessed_students, dtype=np.float32),
            'course_features':  np.array(preprocessed_courses, dtype=np.float32)
        }
        if is_save_json:
            filepath = f"{preprocessed_filepath_prefix}_{len(data['students'])}-students_{len(data['courses'])}-courses.json"
            save_preprocessed_dataset_json(preprocessed_data, filepath)
            print(f"Preprocessed dataset saved to {filepath}")
        return preprocessed_data
    
def save_preprocessed_dataset_json(data: Dict, filepath: str = './data/preprocessed-dataset.json'):
    """Save preprocessed dataset to JSON"""
    save_data = {k: v for k, v in data.items() if k not in ['student_features', 'course_features']}
    save_data['student_features'] = data['student_features'].tolist()
    save_data['course_features'] = data['course_features'].tolist()
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(save_data, f, indent=2, ensure_ascii=False)