import { getAllCourses } from '../services/course.service.js';



// Map course IDs to course names
const mapCourseIdstoCourse = async () => {
    try {
        console.log('Mapping course IDs to course names...');
        const courseMap = {};
        const courses = await getAllCourses();
        courses.forEach(course => {
            course['description'] = 'Chúc bạn thi tốt!'; // remove description to save space
            courseMap[course.id] = course
        });
        return courseMap;
    } catch (error) {
        throw new Error('Error mapping course IDs to names: ' + error.message);
    }
};

export { mapCourseIdstoCourse };