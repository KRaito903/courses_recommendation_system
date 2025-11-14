import { getStudentsByMajorAndSemester } from './services/student.service.js';

const testGetStudentsByMajorAndSemester = async () => {
    try {
        const major_code = 'MMT hướng ATTT';
        const semester = 10;
        console.log(`🔍 Testing getStudentsByMajorAndSemester with major_code=${major_code} and semester=${semester}`);
        const student = await getStudentsByMajorAndSemester(major_code, semester, '10');
        console.log('✅ Result:', student);
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
};

testGetStudentsByMajorAndSemester();


