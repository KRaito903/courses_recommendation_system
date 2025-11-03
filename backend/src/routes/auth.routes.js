import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);

// test
authRouter.get('/test', (req, res) => {
    res.send('Auth route is working!');
});

export default authRouter;