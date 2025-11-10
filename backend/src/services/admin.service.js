import {db, admin} from '../config/firebase.config.js';


export const getStats = async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        const studentsSnapshot = await db.collection('students').get();
        const totalStudents = studentsSnapshot.size;

        const coursesSnapshot = await db.collection('courses').get();
        const totalCourses = coursesSnapshot.size;

        const enrollmentsSnapshot = await db.collection('enrollments').get();
        const totalEnrollments = enrollmentsSnapshot.size;


        res.status(200).send({
            totalUsers: totalUsers,
            totalStudents: totalStudents,
            totalCourses: totalCourses,
            totalEnrollments: totalEnrollments  
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        res.status(500).send({ message: 'Lỗi máy chủ khi lấy thống kê.' });
    }
};