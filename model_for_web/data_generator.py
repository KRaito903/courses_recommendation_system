from typing import Dict, List, Optional
import numpy as np
import json
import requests

STUDENT_CODE_PREFIX_TO_INIT_SEMESTER = {
    '22': 10,
    '23': 7,
    '24': 4,
    '25': 1
}

class DataGenerator:
    """Generate synthetic course recommendation dataset"""
    @staticmethod
    def generate_student(num_student: int,
                        student_code_length: int = 8,
                        student_major_code_list: List[str] = ["MMT hướng ATTT", "MMT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "ATTT", "CNTTin"],
                        semester_list: List[int] = [1, 4, 7, 10],
                        gpa_scale: float = 10.0,
                        default_image_url: str = "https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/540980380_1301233021796524_5335302452002559776_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=qC5AoRw5sHsQ7kNvwGjC9fo&_nc_oc=AdlEeEwoPxMKCYWqRgynYKmm1MVk-gLwUz2NeqU4AKdbh51QQlfCod6kGneA1vSxWjA&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=lWjMtWSscEjE83e7I68NWQ&oh=00_AfhXO59tJvLjwDGlvCgg9gKsqe5XgvSmeQ2H29nEcoA1RQ&oe=69159460",
                        init_semester_by_student_code_prefix: Dict = None
                        ) -> List[Dict]:
        """
        Generate synthetic student data
        Args:
            num_student (int): Number of students to generate
            student_code_length (int): Length of the student code string
            student_major_code_list (List[str]): List of possible student major codes
            semester_list (List[int]): List of possible semesters
            gpa_scale (float): Maximum GPA value
            default_image_url (str): Default image URL for students
            init_semester_by_student_code_prefix (Dict): Mapping from student code prefix to initial semester
        Returns:
            List[Dict]: List of student dictionaries
                a student:
                    student_id: int (0 to num_students-1)
                    student_code: str of length student_code_length (such as "22127001", "23127002", "24127003", "25127004"...)
                    student_name: str ("Student {student_id}")
                    student_major_code: str in student_major_code_list
                    semester: int in semester_list or determined by student_code prefix
                    gpa: float in range [0.0, gpa_scale]
                    image_url: str (default_image_url)
        """
        np.random.seed(36)
        students = []
        for i in range(num_student):
            student_id = i
            student_code = str(22000000 + i + 1)[-student_code_length:]
            student_name = f"Student {student_id}"
            student_major_code = np.random.choice(student_major_code_list)
            if init_semester_by_student_code_prefix:
                prefix = student_code[:2]
                semester = init_semester_by_student_code_prefix.get(prefix, np.random.choice(semester_list))
            else:
                semester = int(np.random.choice(semester_list))
            gpa = float(np.random.randint(0, gpa_scale * 10 + 1))
            image_url = default_image_url

            students.append({
                'student_id': student_id,
                'student_code': student_code,
                'student_name': student_name,
                'student_major_code': student_major_code,
                'semester': semester,
                'gpa': gpa,
                'image_url': image_url
            })
        return students

    @staticmethod
    def generate_course(num_course: int,
                        course_code_length: int = 8,
                        course_name_prefix_list: List[str] = ['CSC', 'MTH', 'PHY'],
                        course_major_code_list: List[str] = ["Cơ sở ngành", "Đại cương", "MMT hướng ATTT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "HTTT/KHDL", "MMT hướng ATTT/CNTThuc"],
                        semester_range: List[int] = [1, 12],
                        credit_list: List[int] = [2, 4, 6],
                        weight_values: List[float] = [0.0, 0.25, 0.5, 1.0],
                        num_weights: int = 9,
                    ) -> List[Dict]:
        """
        Generate synthetic course data
        Args:
            num_course (int): Number of courses to generate
            course_code_length (int): Length of the course code string
            course_name_prefix (str): Prefix for course names
            course_major_code_list (List[str]): List of possible course major codes
            semester_range (List[int]): Range of possible semesters [min, max]
            credit_list (List[int]): List of possible credit values
            weight_values (List[float]): List of possible weight values for majors
        Returns:
            List[Dict]: List of course dictionaries
                a course:
                    course_id: int (0 to num_courses-1)
                    course_code: str of length course_code_length within prefix (such as "CSC00001", "MTH00002", "PHY00003"...)
                    course_name: str ("Course {course_id}")
                    course_major_code: str in course_major_code_list
                    semester: int in range semester_range
                    credit: int in credit_list
                    weight: List[float] of length len(course_major_code_list)
        """
        np.random.seed(36)
        courses = []
        # number of majors for weight vector length is now controlled by num_weights
        num_majors = num_weights
        for i in range(num_course):
            course_id = i
            course_code = np.random.choice(course_name_prefix_list) + f"{i:0{course_code_length - len(course_name_prefix_list[0])}d}"
            course_name = f"Course {course_id}"
            course_major_code = np.random.choice(course_major_code_list)
            semester = int(np.random.randint(semester_range[0], semester_range[1] + 1))
            credit = int(np.random.choice(credit_list))
            course_weight = list(np.random.choice(weight_values, size=num_majors))

            courses.append({
                'course_id': course_id,
                'course_code': course_code,
                'course_name': course_name,
                'course_major_code': course_major_code,
                'semester': semester,
                'credit': credit,
                'weight': course_weight
            })
        return courses

    @staticmethod
    def generate_enrollments(students: List[Dict], courses: List[Dict],
                            avg_enrolled_courses_per_student: int = 8,
                            avg_will_enroll_courses_per_student: int = 0,
                            enrollment_list: List[str] = ['liked', 'disliked']
                            ) -> List[Dict]:
        """
        Generate synthetic enrollment data
        Args:
            students (List[Dict]): List of student dictionaries
            courses (List[Dict]): List of course dictionaries
            enrollment_list (List[str]): List of possible enrollment types
            avg_enrolled_courses_per_student (int): Average number of courses each student enrolls in
            avg_will_enroll_courses_per_student (int): Average number of courses each student will enroll in
        Returns:
            List[Dict]: List of enrollment dictionaries
                a enrollment:
                    student_id: int in students
                    course_id: int in courses
                    type: str in enrollment_list or "will_enroll" (if avg_will_enroll_courses_per_student > 0)
                constraints:
                    each student enrolls in approx avg_courses_per_student courses
                    student.semester >= course.semester for enrolled courses
                    a student will enroll some courses with semester > student.semester (if avg_will_enroll_courses_per_student > 0)
        """
        np.random.seed(36)
        enrollments = []
        for student in students:
            sid = student['student_id']
            student_semester = student['semester']
            
            possible_courses = [course for course in courses if course['semester'] <= student_semester]
            num_enroll = min(len(possible_courses), np.random.poisson(avg_enrolled_courses_per_student))
            enrolled_courses = np.random.choice(possible_courses, size=num_enroll, replace=False)
            for course in enrolled_courses:
                course_id = course['course_id']
                enroll_type = np.random.choice(enrollment_list)
                enrollments.append({
                    'student_id': sid,
                    'course_id': course_id,
                    'type': enroll_type
                })

            if avg_will_enroll_courses_per_student > 0:
                future_courses = [course for course in courses if course['semester'] > student_semester]
                num_will_enroll = min(len(future_courses), np.random.poisson(avg_will_enroll_courses_per_student))
                will_enroll_courses = np.random.choice(future_courses, size=num_will_enroll, replace=False)
                for course in will_enroll_courses:
                    course_id = course['course_id']
                    enrollments.append({
                        'student_id': sid,
                        'course_id': course_id,
                        'type': 'will_enroll'
                    })
        return enrollments

    @staticmethod
    def generate_data(
        num_student: int,
        num_course: int,
        avg_enrolled_courses_per_student: int = 8,
        avg_will_enroll_courses_per_student: int = 0,
        student_code_length: int = 8,
        student_major_code_list: List[str] = ["MMT hướng ATTT", "MMT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "ATTT", "CNTTin"],
        semester_list: List[int] = [1, 4, 7, 10],
        gpa_scale: float = 10.0,
        default_image_url: str = "https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/540980380_1301233021796524_5335302452002559776_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=qC5AoRw5sHsQ7kNvwGjC9fo&_nc_oc=AdlEeEwoPxMKCYWqRgynYKmm1MVk-gLwUz2NeqU4AKdbh51QQlfCod6kGneA1vSxWjA&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=lWjMtWSscEjE83e7I68NWQ&oh=00_AfhXO59tJvLjwDGlvCgg9gKsqe5XgvSmeQ2H29nEcoA1RQ&oe=69159460",
        init_semester_by_student_code_prefix: Dict = None,
        course_code_length: int = 8,
        course_name_prefix_list: List[str] = ['CSC', 'MTH', 'PHY'],
        course_major_code_list: List[str] = ["Cơ sở ngành", "Đại cương", "MMT hướng ATTT", "HTTT", "KTPM", "KHMT hướng TTNT", "CNTThuc", "TGMT", "KHDL", "HTTT/KHDL", "MMT hướng ATTT/CNTThuc"],
        semester_range: List[int] = [1, 12],
        credit_list: List[int] = [2, 4, 6],
        weight_values: List[float] = [0.0, 0.25, 0.5, 1.0],
        num_weights: int = 9,
        enrollment_list: List[str] = ['liked', 'disliked'],          
        is_save_json: bool = True,
        generated_filepath_prefix: str = './data/generated-dataset'
    ) -> Dict:
        """Generate a synthetic dataset with students, courses, and enrollments"""
        # generate_student is a staticmethod; call it via the class to avoid
        # relying on an instance 'self'. Note: the student generator uses the
        # param name `tudent_code_length` (typo) so pass by keyword accordingly.
        students = DataGenerator.generate_student(
            num_student=num_student,
            student_code_length=student_code_length,
            student_major_code_list=student_major_code_list,
            semester_list=semester_list,
            gpa_scale=gpa_scale,
            default_image_url=default_image_url,
            init_semester_by_student_code_prefix=init_semester_by_student_code_prefix
        )
        
        courses = DataGenerator.generate_course(
            num_course=num_course,
            course_code_length=course_code_length,
            course_name_prefix_list=course_name_prefix_list,
            course_major_code_list=course_major_code_list,
            semester_range=semester_range,
            credit_list=credit_list,
            weight_values=weight_values,
            num_weights=num_weights
        )
        
        enrollments = DataGenerator.generate_enrollments(
            students=students,
            courses=courses,
            avg_enrolled_courses_per_student=avg_enrolled_courses_per_student,
            avg_will_enroll_courses_per_student=avg_will_enroll_courses_per_student,
            enrollment_list=enrollment_list
        )
        
        dataset = {
            'students': students,
            'courses': courses,
            'enrollments': enrollments
        }
        if is_save_json:
            filepath = f"{generated_filepath_prefix}_{num_student}-students_{num_course}-courses.json"
            save_generated_dataset_json(dataset, filepath)
            print(f"Dataset saved to {filepath}")
        return dataset

def save_generated_dataset_json(data: Dict, filepath: str = './data/generated-dataset.json'):
    """Save generated dataset to JSON using UTF-8 and preserve Unicode."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def save_generated_dataset_to_firebase(data: Dict, irebase_url: str,
                           path: str = '',
                           auth: Optional[str] = None,
                           as_preprocessed: bool = False,
                           timeout: int = 10):
    """Save generated dataset to Firebase Realtime Database
    Args:
        data (Dict): The dataset to save
        firebase_url (str): The base URL of the Firebase Realtime Database
        path (str): The path within the database to save the data
        auth (Optional[str]): Optional authentication token
        as_preprocessed (bool): Whether to save as preprocessed dataset
        timeout (int): Request timeout in seconds
    """
    base = irebase_url.rstrip('/')
    p = path.lstrip('/')
    url = f"{base}/{p}.json" if p else f"{base}.json"
    params = {}
    if auth:
        params['auth'] = auth
    if as_preprocessed:
        from data_preprocessor import DataPreprocessor
        data = DataPreprocessor.preprocess_data(data, is_save_json=False)
    response = requests.put(url, json=data, params=params, timeout=timeout)
    response.raise_for_status()