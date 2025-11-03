// src/api/index.js
import { Router } from 'express';

// Import các routes con
import authRoutes from './auth.routes.js';
// import userRoutes from './user.routes.js';
// import courseRoutes from './course.routes.js';

// Khởi tạo router chính
const mainRouter = Router();

// Cắm các routes con vào router chính
mainRouter.use('/auth', authRoutes); 

// // Mọi request đến /user sẽ được chuyển cho userRoutes
// mainRouter.use('/user', userRoutes);

// // Mọi request đến /course sẽ được chuyển cho courseRoutes
// mainRouter.use('/course', courseRoutes);

// Xuất router chính
export default mainRouter;