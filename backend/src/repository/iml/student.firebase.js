import { db } from '../../config/firebase.js';
import { StudentRepository } from '../student.repository.js';
class StudentIml extends StudentRepository {
    constructor() {
        super();
        if (this.StudentIml instanceof StudentIml) {
            throw new Error("Singleton classes can't be instantiated more than once.");
        }
        this.studentCollection = db.collection('students');
    }

    async createStudent(studentData) {
        try {
            let student_id = studentData.student_id;
            if (!student_id) {
                const snapshot = await this.studentCollection.get();
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
            const studentRef = this.studentCollection.doc(student_id.toString());
            await studentRef
}
