// src/services/recommendationService.js
import { apiClient } from '../utils/apiClient.js';

/**
 * Get all recommendations from GNN model
 * Model returns list sorted by priority, UI displays rank
 * 
 * @param {string} token - JWT token
 * @param {string} student_id - Student ID
 * @returns {Promise<Array>} List of recommended courses with rank
 */
export async function getRecommendations(token, student_id) {
    try {
        console.log('📥 Fetching recommendations for student:', student_id);
        
        const response = await apiClient.get(
            `/api/recommendations/get-all/${student_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Model returns sorted list, we add rank based on position
        const recommendationsWithRank = response.data.map((course, index) => ({
            ...course,
            rank: index + 1
        }));

        console.log('✅ Recommendations loaded:', recommendationsWithRank.length);
        return recommendationsWithRank;
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
        
        const response = await apiClient.get(
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

