// src/api/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { getUser, updateDisplayName } from '../controllers/user.controller.js';

// Import middleware
import { checkAuth } from '../middlewares/checkAuth.js';

const router = Router();

// POST /api/auth/register-profile
// Route này YÊU CẦU user phải gửi Token hợp lệ (đã xác thực email)
// 1. 'checkAuth' chạy trước
// 2. 'authController.registerProfile' chạy sau
router.post('/register-profile', checkAuth, authController.registerProfile);


// user

router.get('/user', checkAuth, getUser);
router.put('/user', checkAuth, updateDisplayName);
export default router;