import { db } from '../config/firebase.config.js';


const studentCollection = db.collection('students');
//  --CREATE STUDENT--
// Create new student
const createStudent = async (studentData) => {
    try {
        let student_id = studentData.student_id;
        if (!student_id) {
            const snapshot = await studentCollection.get();
            let maxId = 0;
            snapshot.forEach(doc => {
                const candidate = doc.id;
                const n = parseInt(candidate, 10);
                if (!isNaN(n) && n > maxId) maxId = n;
            });
            const newId = maxId + 1;
            studentData.student_id = newId;
            student_id = newId;
            console.log(`ℹ️ Auto-generated student_id: ${newId}`);
        }
        const studentRef = studentCollection.doc(student_id.toString());
        await studentRef.set(studentData);
        console.log(`✅ Student with ID ${student_id} created successfully.`);
        return { id: studentRef.id, ...studentData };
    } catch (error) {
        throw new Error('Error creating student: ' + error.message);
    }
};

// creat multiple students  
const createMultipleStudents = async (studentsData) => {
   try {
         const batch = db.batch();
         if (!Array.isArray(studentsData)) {
             throw new Error('studentsData must be an array');
         };
         studentsData.forEach((studentData) => {
             const student_id = studentData.student_id.toString();
             if (!student_id) {
                 throw new Error('student_id is required for each student');
             }
             const studentRef = studentCollection.doc(student_id);
             batch.set(studentRef, studentData);
         });
         await batch.commit();
         console.log(`✅ ${studentsData.length} students created successfully.`);
         return studentsData.map(studentData => ({ id: studentData.student_id, ...studentData }));
   }
   catch (error) {
       throw new Error('Error creating multiple students: ' + error.message);
   }
};

// --READ STUDENT--

// Get student by ID
const getStudentById = async (student_id) => {
    try {
        const studentRef = studentCollection.doc(student_id.toString());
        const doc = await studentRef.get();
        if (!doc.exists) {
            throw new Error(`Student with ID ${student_id} not found`);
        }
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        throw new Error('Error getting student: ' + error.message);
    }
};

// get student by student code
const getStudnetByStudentCode = async (student_code) => {
    try {
        const querySnapshot = await studentCollection.where('student_code', '==', student_code).get();
        if (querySnapshot.empty) {
           return { exists: false}
        }
        // Assuming student_code is unique, return the first matching document
        const doc = querySnapshot.docs[0];
        return { exists: true , ...doc.data() };
    } catch (error) {
        throw new Error('Error getting student by code: ' + error.message);
    }

};
// get all students
const getAllStudents = async () => {
    try {
        const snapshot = await studentCollection.get();
        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        return students;
    } catch (error) {
        throw new Error('Error getting students: ' + error.message);
    }
};

// get student by major and semester
const getStudentsByMajorAndSemester = async (major_code, semester) => {
    try {
        const querySnapshot = await studentCollection.where('student_major_code', '==', major_code)
            .where('semester', '==', semester)
            .get();
        const students = [];
        querySnapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        return students[0];
    } catch (error) {
        throw new Error('Error getting students by major and semester: ' + error.message);
    }
};

// --UPDATE STUDENT--

// Update student by ID
const updateStudentById = async (student_id, updateData) => {
    try {
        const studentRef = studentCollection.doc(student_id);
        await studentRef.update(updateData);
        console.log(`✅ Student with ID ${student_id} updated successfully.`);
        const updatedDoc = await studentRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        throw new Error('Error updating student: ' + error.message);
    }
};

// --DELETE STUDENT--

// Delete student by ID
const deleteStudentById = async (student_id) => {
    try {
        const studentRef = studentCollection.doc(student_id);
        await studentRef.delete();
        console.log(`✅ Student with ID ${student_id} deleted successfully.`);
        return { message: `Student with ID ${student_id} deleted successfully.` };
    } catch (error) {
        throw new Error('Error deleting student: ' + error.message);
    }
};

export { createStudent, getStudentById, updateStudentById, deleteStudentById , getAllStudents, createMultipleStudents, getStudnetByStudentCode, getStudentsByMajorAndSemester };