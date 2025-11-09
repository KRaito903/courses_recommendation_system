// src/services/courseService.js
import * as apiClient from '../utils/apiClient.js';

/**
 * Get all courses enrolled by a student
 * @param {string} token - Firebase ID token
 * @param {number} student_id - Student ID (MSSV)
 * @returns {Promise<Array>} Array of courses with enrollment info
 */
export const getStudentCourses = async (token, student_id) => {
    try {
        if (!token || !student_id) {
            throw new Error('Token and student_id are required');
        }
        
        console.log(`📚 Fetching courses for student ${student_id}...`);

        const response = await apiClient.get(
            `/enrollments/student/${student_id}`,
            { Authorization: `Bearer ${token}` }
        );
        
        console.log('✅ Courses fetched successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error fetching student courses:', error);
        throw error;
    }
};

/**
 * Create a new enrollment (add course to student's list)
 * @param {string} token - Firebase ID token
 * @param {number} student_id - Student ID (MSSV)
 * @param {number} course_id - Course ID
 * @param {string} type - Enrollment type ('liked', 'disliked', 'neutral')
 * @returns {Promise<Object>} Created enrollment data
 */
export const createEnrollment = async (token, student_id, course_id, type = 'neutral') => {
    try {
        console.log(`📝 Creating enrollment for student ${student_id} and course ${course_id} with type ${type}...`);
        if (!token || !student_id || course_id === undefined) {
            throw new Error('Token, student_id, and course_id are required');
        }

        if (!['liked', 'disliked', 'neutral'].includes(type)) {
            throw new Error('Type must be one of: liked, disliked, neutral');
        }

        const enrollmentData = {
            student_id: Number(student_id),
            course_id: Number(course_id),
            type: type
        };

        console.log('📝 Creating enrollment:', enrollmentData);

        const response = await apiClient.post(
            '/enrollments',
            enrollmentData,
            { Authorization: `Bearer ${token}` }
        );

        console.log('✅ Enrollment created successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error creating enrollment:', error);
        throw error;
    }
};

/**
 * Get all available courses (not filtered by student)
 * @param {string} token - Firebase ID token
 * @returns {Promise<Array>} Array of all courses
 */
export const getAllCourses = async (token) => {
    try {
        if (!token) {
            throw new Error('Token is required');
        }

        console.log('📚 Fetching all available courses...');

        const response = await apiClient.get(
            '/courses',
            { Authorization: `Bearer ${token}` }
        );

        console.log('✅ All courses fetched successfully');
        return response;
    } catch (error) {
        console.error('❌ Error fetching all courses:', error);
        throw error;
    }
};

/**
 * Update an enrollment (change rating/type)
 * @param {string} token - Firebase ID token
 * @param {number} student_id - Student ID (MSSV)
 * @param {number} course_id - Course ID
 * @param {string} type - New enrollment type ('liked', 'disliked', 'neutral')
 * @returns {Promise<Object>} Updated enrollment data
 */
export const updateEnrollment = async (token, student_id, course_id, type) => {
    try {
        if (!token || !student_id || course_id === undefined || !type) {
            throw new Error('Token, student_id, course_id, and type are required');
        }

        if (!['liked', 'disliked', 'neutral'].includes(type)) {
            throw new Error('Type must be one of: liked, disliked, neutral');
        }

        const enrollment_id = `${student_id}_${course_id}`;
        const updateData = { type };

        console.log(`📝 Updating enrollment ${enrollment_id} to type: ${type}`);

        const response = await apiClient.put(
            `/enrollments/${enrollment_id}`,
            updateData,
            { Authorization: `Bearer ${token}` }
        );

        console.log('✅ Enrollment updated successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error updating enrollment:', error);
        throw error;
    }
};

/**
 * Delete an enrollment (remove course from student's list)
 * @param {string} token - Firebase ID token
 * @param {number} student_id - Student ID (MSSV)
 * @param {number} course_id - Course ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteEnrollment = async (token, student_id, course_id) => {
    try {
        if (!token || !student_id || course_id === undefined) {
            throw new Error('Token, student_id, and course_id are required');
        }

        const enrollment_id = `${student_id}_${course_id}`;

        console.log(`🗑️ Deleting enrollment ${enrollment_id}`);

        const response = await apiClient.del(
            `/enrollments/${enrollment_id}`,
            { Authorization: `Bearer ${token}` }
        );

        console.log('✅ Enrollment deleted successfully');
        return response;
    } catch (error) {
        console.error('❌ Error deleting enrollment:', error);
        throw error;
    }
};
