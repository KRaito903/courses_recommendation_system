import { admin } from '../config/firebase.config.js';

export const setUpRole = async (uid, role) => {
    try {
        // Thiết lập custom claims cho user
        await admin.auth().setCustomUserClaims(uid, { role });
        console.log(`✅ Đã thiết lập vai trò '${role}' cho user với UID: ${uid}`);
    } catch (error) {
        console.error('Lỗi khi thiết lập vai trò:', error);
        throw new Error('Không thể thiết lập vai trò cho user.');
    }
};
