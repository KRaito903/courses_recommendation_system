// src/api/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

// Import middleware
import { checkAuth } from '../middlewares/checkAuth.js';

const router = Router();

// POST /api/auth/register-profile
// Route này YÊU CẦU user phải gửi Token hợp lệ (đã xác thực email)
// 1. 'checkAuth' chạy trước
// 2. 'authController.registerProfile' chạy sau
router.post('/register-profile', checkAuth, authController.registerProfile);

// Chúng ta không cần route /register (nhận password) nữa
// vì việc đó do Client xử lý.

// Route /login cũng không cần thiết ở backend,
// vì Client tự đăng nhập và lấy Token.

export default router;