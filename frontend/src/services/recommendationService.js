// src/services/recommendationService.js
import { get, put, post, del } from '../utils/apiClient.js';

/**
 * Get all recommendations from GNN model
 * Model returns list sorted by priority, UI displays rank
 * 
 * @param {string} token - JWT token
 * @param {string} student_id - Student ID
 * @returns {Promise<Array>} List of recommended courses with rank
 */
export async function getRecommendations(token, student_id, semesterFilter = 0, k = 10) {
    try {
        console.log('📥 Fetching recommendations for student:', student_id);
        console.log('📥 Semester filter:', semesterFilter, 'Top K:', k);
        const response = await get(`/auth/recommendations?student_id=${student_id}&semester_filter=${semesterFilter}&k=${k}`,token);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching recommendations:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch recommendations');
    }
}

export async function getRecommendationsV2(token, student_id, semesterFilter = 0, k = 10, major_code='') {
    try {
        console.log('📥 Fetching recommendations for student:', student_id);
        console.log('📥 Semester filter:', semesterFilter, 'Top K:', k);
        const response = await get(`/auth/recommendationsV2?student_id=${student_id}&semester_filter=${semesterFilter}&k=${k}&major_code=${major_code}`,token);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching recommendations:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch recommendations');
    }
}


/**
 * Get user's enrolled courses for graph visualization
 * @param {string} token - JWT token
 * @param {string} student_id - Student ID
 * @returns {Promise<Array>} List of enrolled courses
 */
export async function getEnrolledCourses(token, student_id) {
    try {
        console.log('📥 Fetching enrolled courses for student:', student_id);
        
        const response = await apiRequest.get(
            `/api/student/courses/${student_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Enrolled courses loaded:', response.data.length);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching enrolled courses:', error);
        return []; // Return empty array if fails
    }
}

