
import { getUserById } from '../services/user.service.js';
import { getStudentById } from '../services/student.service.js'


export const getUser = async (req, res) => {
    const userId = req.user.uid;
    try {
        const userDoc = await getUserById(userId);
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const student = await getStudentById(userDoc.data().student_ref);
        return res.status(200).json({ user: { ...userDoc.data() }, student: { ...student } });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

