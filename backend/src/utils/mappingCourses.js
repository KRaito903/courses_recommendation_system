import { getAllCourses } from '../services/course.service.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const coursesFilePath = process.env.PATH_TO_COURSES

// Map course IDs to course names
const mapCourseIdstoCourse = async () => {
    try {
        console.log('Mapping course IDs to course names...');
        const courseMap = {};
        const courses =  JSON.parse(fs.readFileSync(path.resolve(coursesFilePath), 'utf-8'));
        courses.forEach(course => {
            course['description'] = 'Chúc bạn thi tốt!'; // remove description to save space
            courseMap[course.id] = course
        });
        // Save to local file for caching
        console.log('Course ID to Name mapping completed and saved to', coursesFilePath);
        return courseMap;
    } catch (error) {
        throw new Error('Error mapping course IDs to names: ' + error.message);
    }
};

export { mapCourseIdstoCourse };