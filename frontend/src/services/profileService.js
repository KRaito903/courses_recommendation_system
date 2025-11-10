// src/services/profileService.js
// Service để tương tác với backend API liên quan đến user profile

import { post, get, put } from '../utils/apiClient.js';

/**
 * Tạo profile cho user mới đăng ký
 * Gọi API: POST /api/auth/register-profile
 * @param {string} token - Firebase ID Token
 * @param {object} profileData - { mssv, displayName }
 */
export const createProfile = async (token, profileData) => {
    try {
        const response = await post('/auth/register-profile', profileData, token);
        console.log('✅ Profile created successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error creating profile:', error.message);
        throw error;
    }
};

/**
 * Lấy thông tin profile của user hiện tại
 * Gọi API: GET /api/students/:id
 * @param {string} token - Firebase ID Token
 */
export const getProfile = async (token) => {
    try {
        const response = await get(`/auth/user`, token);
        console.log('✅ Profile fetched successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error fetching profile:', error.message);
        throw error;
    }
};

/**
 * Cập nhật thông tin profile
 * Gọi API: PUT /api/students/:id
 * @param {string} token - Firebase ID Token
 * @param {string} studentId - MSSV của sinh viên
 * @param {object} updateData - Dữ liệu cần cập nhật
 */
export const updateProfile = async (token, updateData) => {
    try {
        const response = await put(`/auth/user`, updateData, token);
        console.log('✅ Profile updated successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error updating profile:', error.message);
        throw error;
    }
};




export const updateStudent = async (token, studentId, updateData) => {
    try {
        const response = await put(`/students/${studentId}`, updateData, token);
        console.log('✅ Profile updated successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Error updating profile:', error.message);
        throw error;
    }
};

