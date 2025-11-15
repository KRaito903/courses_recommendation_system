
import { createStudent, getStudentById, updateStudentById, deleteStudentById , getAllStudents, createMultipleStudents } from '../services/student.service.js';


class StudentController {
    constructor() {
        this.repository = null;
    }
    // Creat new student when resigning
    async createStudent(req, res, next) {
        try {
            if (Array.isArray(req.body.students)) {
                const studentData = req.body.students;
                const newStudents = await createMultipleStudents(studentData);
                return res.status(201).json(newStudents);
            }
            const studentData = req.body;
            const newStudent = await createStudent(studentData);
            res.status(201).json(newStudent);
        } catch (error) {
            console.error('Error creating student:', error);
            next(error);
        }
    }
    // Get student by ID
    async getStudentById(req, res, next) {
        try {
            const student_id = req.params.id;
            const student = await getStudentById(student_id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            res.status(200).json(student);
        }
        catch (error) {
            console.error('Error getting student by ID:', error);
            next(error);
        }
    }

    // Update student by ID
    async updateStudenetId(req, res, next) {
        try {
            const student_id = req.params.id;
            const updateData = req.body;
            const updatedStudent = await updateStudentById(student_id, updateData);
            if (!updatedStudent){
                return res.status(404).json({ message: 'Student not found' });
            }
            res.status(200).json(updatedStudent);
        }
        catch (error) {
            console.error('Error updating student by ID:', error);
            next(error);
        }
    }
    // Delete student by ID
    async deleteStudentById(req, res, next) {
        try {
            const student_id = req.params.id;
            const deletedStudent = await deleteStudentById(student_id);
            if (!deletedStudent) {
                return res.status(404).json({ message: 'Student not found' });
            }
            res.status(200).json({ message: 'Student deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting student by ID:', error);
            next(error);
        }
    }

    // Get all students
    async getAllStudents(req, res, next) {
        try {
            const students = await getAllStudents();
            res.status(200).json(students);
        }
        catch (error) {
            console.error('Error getting all students:', error);
            next(error);
        }
    }
}

export default new StudentController();
