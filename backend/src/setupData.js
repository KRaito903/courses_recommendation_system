// import { db } from './config/firebase.config.js';

// const setupData = async () => {
//     try {
//        // Add sample student data
//          const studentsRef = db.collection('students');
//          const studentSnapshot = await studentsRef.doc('0').get(); 
//             if (!studentSnapshot.exists) {
//                 await studentsRef.doc('0').set({
//                     student_id: 0,
//                     student_code: 'STU001',
//                     student_name: 'Nguyen Van A',
//                     student_major_code: 'CS',
//                     semester: 5,
//                     gpa: 3.75,
//                     image_url: 'https://example.com/avatar_a.png'
//                 });
//                 console.log('✅ Sample student data added');
//             }
//         // Add sample course data
//         const coursesRef = db.collection('courses');
//         const courseSnapshot = await coursesRef.doc('0').get();
//             if (!courseSnapshot.exists) {
//                 await coursesRef.doc('0').set({
//                     course_id: 0,
//                     course_code: 'CS101',
//                     course_name: 'Introduction to Programming',
//                     course_major_code: 'CS',
//                     semester: 1,
//                     credit: 3,
//                     weight: [0.3, 0.25, 0.1, 0.1, 0.25, 0.0, 0.0, 0.0, 0.0]
//                 });
//                 console.log('✅ Sample course data added');
//     }
//     // Add sample enrollment data
//     const enrollmentsRef = db.collection('enrollments');
//     const enrollmentSnapshot = await enrollmentsRef.doc('0_0').get();
//         if (!enrollmentSnapshot.exists) {
//             await enrollmentsRef.doc('0_0').set({
//                   student_id: 0,
//                   course_id: 0,
//                   type: 'mandatory',
//                   rating: 4.0
//             });
//             console.log('✅ Sample enrollment data added');
//         }
//     }
//     catch (error) {
//         console.error('Error setting up initial data:', error);
//     }
// };
// setupData();
const path = './data/base_data.json';
import { createMultipleStudents } from './services/student.service.js';
import { createMultipleCourses } from './services/course.service.js';
import { createMultipleEnrollments } from './services/enrollment.service.js';
import fs from 'fs';

const upData = async () => {
    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf8'));
        data.students.forEach(student => {
            student.gpa /= 10;  // Chuyển đổi GPA từ thang điểm 10 sang thang điểm 4
        });
        await createMultipleStudents(data.students);
        await createMultipleCourses(data.courses);
        await createMultipleEnrollments(data.enrollments);
        console.log('✅ Initial data setup completed.');
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
    }
};

upData();