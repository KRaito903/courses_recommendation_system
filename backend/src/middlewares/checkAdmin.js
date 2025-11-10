import {admin } from '../config/firebase.config.js';

export const checkAdmin = async (req, res, next) => {
    try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        const customClaims = userRecord.customClaims || {};

        if (customClaims.role && customClaims.role === 'admin') {
            // Người dùng là admin, cho phép tiếp tục
            next();
        } else {
            // Người dùng không phải admin
            return res.status(403).send({ message: 'Truy cập bị cấm. Yêu cầu quyền admin.' });
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền admin:', error);
        res.status(500).send({ message: 'Lỗi máy chủ khi kiểm tra quyền admin.' });
    }
};