// src/api/index.js
import { Router } from 'express';

// Import các routes con
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import studentRouter  from './student.routes.js';
import enrollmentRouter from './enrollment.routes.js';
import adminRouter from './admin.routes.js';
// import profileRouter from './profile.routes.js';

// Khởi tạo router chính
const mainRouter = Router();

// Cắm các routes con vào router chính
mainRouter.use('/auth', authRoutes); 
// mainRouter.use('/profile', profileRouter); // New: Profile API
mainRouter.use('/courses', courseRoutes);
mainRouter.use('/students', studentRouter);
mainRouter.use('/enrollments', enrollmentRouter);

mainRouter.use('/admin', adminRouter);

export default mainRouter;