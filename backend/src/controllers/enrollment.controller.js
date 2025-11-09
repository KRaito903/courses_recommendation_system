import { createEnrollment, getEnrollmentById, updateEnrollmentById, getCoursesOfStudent, deleteEnrollmentById, getAllEnrollments, createMultipleEnrollments } from '../services/enrollment.service.js';
class EnrollmentController {
    // Create new enrollment
    async createEnrollment(req, res, next) {
        try {
            if (Array.isArray(req.body.enrollments)) {
                const enrollmentsData = req.body.enrollments;
                const results = await createMultipleEnrollments(enrollmentsData);
                return res.status(201).json(results);
            }
            const enrollmentData = req.body;
            const newEnrollment = await createEnrollment(enrollmentData);
            res.status(201).json(newEnrollment);
        } catch (error) {
            console.error('Error creating enrollment:', error);
            next(error);
        }
    }

    // Get enrollment by ID
    async getEnrollmentById(req, res, next) {
        try {
            const enrollment_id = req.params.id;
            const enrollment = await getEnrollmentById(enrollment_id);
            if (!enrollment) {
                return res.status(404).json({ message: 'Enrollment not found' });
            }
            res.status(200).json(enrollment);
        }
        catch (error) {
            console.error('Error getting enrollment by ID:', error);
            next(error);
        }
    }

    // Update enrollment by ID
    async updateEnrollmentById(req, res, next) {
        try {
            const enrollment_id = req.params.id;
            const updateData = req.body;
            const updatedEnrollment = await updateEnrollmentById(enrollment_id, updateData);
            if (!updatedEnrollment) {
                return res.status(404).json({ message: 'Enrollment not found' });
            }
            res.status(200).json(updatedEnrollment);
        }
        catch (error) {
            console.error('Error updating enrollment by ID:', error);
            next(error);
        }
    }
    // Delete enrollment by ID
    async deleteEnrollmentById(req, res, next) {
        try {
            const enrollment_id = req.params.id;
            const deletedEnrollment = await deleteEnrollmentById(enrollment_id);
            if (!deletedEnrollment) {
                return res.status(404).json({ message: 'Enrollment not found' });
            }
            res.status(200).json({ message: 'Enrollment deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting enrollment by ID:', error);
            next(error);
        }
    }

    // Get courses of student by student ID
    async getCoursesOfStudent(req, res, next) {
        try {
            const student_id = req.params.student_id;
            const courses = await getCoursesOfStudent(student_id);
            console.log('Courses fetched for student_id in controller:', courses);
            res.status(200).json(courses);
        }
        catch (error) {
            console.error('Error getting courses of student:', error);
            next(error);
        }
    }

    // get all enrollments 
    async getAllEnrollments(req, res, next) {
        try {
            const enrollments = await getAllEnrollments();
            res.status(200).json(enrollments);
        } catch (error) {
            console.error('Error getting all enrollments:', error);
            next(error);
        }
    }

    // delete enrollment by ID
    async deleteEnrollmentById(req, res, next) {
        try {
            const enrollment_id = req.params.id;
            const result = await deleteEnrollmentById(enrollment_id);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error deleting enrollment:', error);
            next(error);
        }
    }
}

export default new EnrollmentController();