// src/controllers/auth.controller.js
import { db } from '../config/firebase.config.js';

export const registerProfile = async (req, res) => {
    try {
        // 1. Lấy thông tin user đã được giải mã từ middleware
        const { uid, email, email_verified } = req.user; 
        
        // 2. Lấy thông tin nghiệp vụ từ body
        const { student_code, displayName } = req.body;

        if (!student_code || !displayName) {
            return res.status(400).send({ message: 'Thiếu MSSV hoặc Tên hiển thị.' });
        }

        // 3. Kiểm tra xem profile đã tồn tại chưa (idempotent)
        const userRef = db.collection('users').doc(uid);
        const existingDoc = await userRef.get();
        
        if (existingDoc.exists) {
            console.log(`ℹ️ Profile đã tồn tại cho user ${uid}`);
            return res.status(200).send({
                message: 'Profile đã tồn tại.',
                uid: uid,
                ...existingDoc.data()
            });
        }
        
        // 4. Tạo "trường mẫu" (profile) trong Firestore
        const userProfile = {
            email: email,   
            displayName: displayName,
            student_code: student_code,
            emailVerified: email_verified, // Sẽ là 'true'
            createdAt: new Date().toISOString()
        };

        // Ghi vào collection 'users' với ID là uid
        await userRef.set(userProfile);

        console.log(`✅ Profile mới được tạo cho user ${uid}`);

        // 5. Trả về thành công
        res.status(201).send({
            message: 'Tạo hồ sơ thành công!',
            uid: uid,
            ...userProfile
        });

    } catch (error) {
        console.error('Lỗi khi tạo hồ sơ:', error);
        res.status(500).send({ message: 'Lỗi server', error: error.message });
    }
};