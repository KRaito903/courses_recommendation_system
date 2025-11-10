import { db } from '../config/firebase.config.js';

const enrollmentCollection = db.collection('enrollments');

// CRREATE ENROLLMENT
// Create new enrollment
const createEnrollment = async (enrollmentData) => {
    try {
        const enrollment_id = enrollmentData.student_id.toString() + '_' + enrollmentData.course_id.toString();  
        if  (!enrollment_id) {
            throw new Error('enrollment_id is required');
        }
        const enrollmentRef = enrollmentCollection.doc(enrollment_id);
        await enrollmentRef.set(enrollmentData);
        console.log(`✅ Enrollment with ID ${enrollment_id} created successfully.`);
        return { id: enrollmentRef.id, ...enrollmentData };
    } catch (error) {
        throw new Error('Error creating enrollment: ' + error.message);
    }
};

// create mutiple enrollments
 const createMultipleEnrollments = async (enrollmentsData) => {
    try {
        const batch = db.batch();
        if (!Array.isArray(enrollmentsData) || enrollmentsData.length === 0) {
            throw new Error('enrollmentsData must be a non-empty array');
        }
        enrollmentsData.forEach(enrollmentData => {
            const enrollment_id = enrollmentData.student_id.toString() + '_' + enrollmentData.course_id.toString();  
            const enrollmentRef = enrollmentCollection.doc(enrollment_id);
            batch.set(enrollmentRef, enrollmentData);
        });
        await batch.commit();
        console.log(`✅ ${enrollmentsData.length} enrollments created successfully.`);
        return { message: `${enrollmentsData.length} enrollments created successfully.` };
    } catch (error) {
        throw new Error('Error creating multiple enrollments: ' + error.message);
    }
};


// READ ENROLLMENT
// Get enrollment by ID
const getEnrollmentById = async (enrollment_id) => {
    try {
        const enrollRef = enrollmentCollection.doc(enrollment_id);
        const doc = await enrollRef.get();
        if (!doc.exists) {
            throw new Error(`Enrollment with ID ${enrollment_id} not found`);
        }
        return { id: doc.id, ...doc.data() };
    }
    catch (error) {
        throw new Error('Error getting enrollment: ' + error.message);
    }
};

// get all enrollments
const getAllEnrollments = async () => {
    try {
        const snapshot = await enrollmentCollection.get();
        const enrollments = [];
        snapshot.forEach(doc => {
            enrollments.push({ id: doc.id, ...doc.data() });
        });
        return enrollments;
    } catch (error) {
        throw new Error('Error getting enrollments: ' + error.message);
    }
};

// Get course of student by student ID
const getCoursesOfStudent = async (student_id) => {
    try {
        const enrollments = await enrollmentCollection
            .where('student_id', '==', Number(student_id))
            .get();
        console.log('Enrollments fetched for student_id:', typeof(student_id));
        // Mapping enrollment documents to their corresponding course documents
        const enrollmentMap = {};
        enrollments.forEach(doc => {
            const course_id = doc.data().course_id;
            enrollmentMap[course_id] = doc.data();
        });
        const course_ids = enrollments.docs.map(doc => doc.data().course_id);
        const coursePromises = course_ids.map(id => db.collection('courses').doc(String(id)).get());
        const courses = await Promise.all(coursePromises);
        return courses.map(doc => ({...doc.data(), type: enrollmentMap[doc.id]?.type || 'unknown'}));
    } catch (error) {
        throw new Error('Error getting courses of student: ' + error.message);
    }
};

// UPDATE ENROLLMENT
// Update enrollment by ID
const updateEnrollmentById = async (enrollment_id, updateData) => {
    try {
        const enrollRef = enrollmentCollection.doc(enrollment_id);
        const doc = await enrollRef.get();
        if (!doc.exists) {
            throw new Error(`Enrollment with ID ${enrollment_id} not found`);
        }
        await enrollRef.update(updateData);
        console.log(`✅ Enrollment with ID ${enrollment_id} updated successfully.`);
        return { id: enrollRef.id, ...updateData };
    } catch (error) {
        throw new Error('Error updating enrollment: ' + error.message);
    }
}
// DELETE ENROLLMENT
// Delete enrollment by ID
const deleteEnrollmentById = async (enrollment_id) => {
    try {
        const enrollRef = enrollmentCollection.doc(enrollment_id);
        const doc = await enrollRef.get();
        if (!doc.exists) {
            throw new Error(`Enrollment with ID ${enrollment_id} not found`);
        }
        await enrollRef.delete();
        console.log(`✅ Enrollment with ID ${enrollment_id} deleted successfully.`);
        return { message: `Enrollment with ID ${enrollment_id} deleted successfully.` };
    } catch (error) {
        throw new Error('Error deleting enrollment: ' + error.message);
    }   
};


// EXPORTS

export { createEnrollment, getEnrollmentById, getAllEnrollments, getCoursesOfStudent, updateEnrollmentById, deleteEnrollmentById, createMultipleEnrollments };