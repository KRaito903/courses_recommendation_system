import { Router } from 'express';
import { checkAdmin } from '../middlewares/checkAdmin.js';
import { getStats } from '../services/admin.service.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { getAllUsers, deleteUserById } from '../services/user.service.js';
import { admin } from '../config/firebase.config.js';

const adminRouter = Router();

// Example admin route
adminRouter.get('/stats', checkAuth ,checkAdmin, getStats);
adminRouter.get('/users', checkAuth, checkAdmin, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

adminRouter.delete('/users/:uid', checkAuth, checkAdmin, async (req, res) => {
    const userUid = req.params.uid;
    try {
        console.log('Deleting user with UID:', userUid);
        const userRecord = await admin.auth().getUser(userUid);
        const customClaims = userRecord.customClaims || {};
        if (customClaims.role && customClaims.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete an admin user' });
        }
        console.log('User is not admin, proceeding to delete.');
        await admin.auth().deleteUser(userUid);
        await deleteUserById(userUid);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default adminRouter;