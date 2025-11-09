// src/middleware/checkAuth.js
import { admin } from '../config/firebase.config.js';

export const checkAuth = async (req, res, next) => {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Chưa xác thực. Thiếu Token.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        // 2. Xác thực token với Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // 3. Kiểm tra email đã được xác thực chưa
        if (!decodedToken.email_verified) {
            return res.status(403).send({ message: 'Truy cập bị cấm. Vui lòng xác thực email của bạn trước.' });
        }

        
        // 4. Gắn thông tin user vào request để controller xử lý
        req.user = decodedToken; // Chứa uid, email, ...
        // 5. Cho phép request đi tiếp
        next(); 
    } catch (error) {
        console.error('Lỗi khi xác thực token:', error);
        res.status(401).send({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};