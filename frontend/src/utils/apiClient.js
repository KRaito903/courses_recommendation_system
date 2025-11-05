// src/utils/apiClient.js
// Utility để gọi API backend với error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Gọi API với token authentication
 * @param {string} endpoint - API endpoint (ví dụ: '/auth/register-profile')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request body data
 * @param {string} token - Firebase ID token
 */
export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Thêm token vào header nếu có
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    // Thêm body nếu có data
    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Parse JSON response
        const responseData = await response.json();

        // Kiểm tra lỗi HTTP
        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Export các wrapper functions cho từng HTTP method
export const get = (endpoint, token = null) => apiRequest(endpoint, 'GET', null, token);
export const post = (endpoint, data, token = null) => apiRequest(endpoint, 'POST', data, token);
export const put = (endpoint, data, token = null) => apiRequest(endpoint, 'PUT', data, token);
export const del = (endpoint, token = null) => apiRequest(endpoint, 'DELETE', null, token);
