// src/controllers/auth.controller.js
import { db } from '../config/firebase.config.js';
import { getStudnetByStudentCode, createStudent } from '../services/student.service.js';

export const registerProfile = async (req, res) => {
    try {
        // 1. Lấy thông tin user đã được giải mã từ middleware
        const { uid, email, email_verified } = req.user; 
        
        // 2. Lấy thông tin nghiệp vụ từ body
        const { student_code, displayName } = req.body;

        if (!student_code || !displayName) {
            return res.status(400).send({ message: 'Thiếu MSSV hoặc Tên hiển thị.' });
        }

        // 3. Kiểm tra xem profile đã tồn tại chưa (idempotent)
        const userRef = db.collection('users').doc(uid);
        const existingDoc = await userRef.get();
        
        if (existingDoc.exists) {
            console.log(`ℹ️ Profile đã tồn tại cho user ${uid}`);
            return res.status(200).send({
                message: 'Profile đã tồn tại.',
                uid: uid,
                ...existingDoc.data()
            });
        }
        
        // 4. Kiểm tra xem student_code có tồn tại trong collection students không
        const studentDoc = await getStudnetByStudentCode(student_code);

        // neu khong ton tai thi tao moi student
        if (!studentDoc.exists) {
            const newStudentData = {
                student_code: student_code,
                name: displayName,
                gpa: null,
                semester: null,
                student_major_code: null,
                image_url: null,
            };

            const createdStudent =  await createStudent(newStudentData);
            console.log('✅ Tạo mới student cho MSSV không tồn tại:', createdStudent);

            await userRef.set({
                email: email,   
                displayName: displayName,
                student_code: student_code,  // Reference to students collection
                student_ref: createdStudent.student_id,      // Firestore document reference
                emailVerified: email_verified, // Sẽ là 'true'
                createdAt: new Date().toISOString()
            });

            console.log(`✅ Profile mới được tạo cho user ${uid}`);
            console.log(`🔗 Đã link user ${uid} với student ${student_code}`);
            res.status(201).send({
                message: 'Tạo hồ sơ thành công!',
                uid: uid,
                email: email,
                displayName: displayName,
                student_code: student_code,
                emailVerified: email_verified,
                createdAt: new Date().toISOString()
            });
            return;
         }

        // 5. Tạo "trường mẫu" (profile) trong Firestore với reference
        const userProfile = {
            email: email,   
            displayName: displayName,
            student_code: student_code,  // Reference to students collection
            student_ref: studentDoc.student_id,      // Firestore document reference
            emailVerified: email_verified, // Sẽ là 'true'
            createdAt: new Date().toISOString()
        };

        // Ghi vào collection 'users' với ID là uid
        await userRef.set(userProfile);

        console.log(`✅ Profile mới được tạo cho user ${uid}`);
        console.log(`🔗 Đã link user ${uid} với student ${student_code}`);

        // 7. Trả về thành công (không trả về student_ref vì không serialize được)
        res.status(201).send({
            message: 'Tạo hồ sơ thành công!',
            uid: uid,
            email: userProfile.email,
            displayName: userProfile.displayName,
            student_code: userProfile.student_code,
            emailVerified: userProfile.emailVerified,
            createdAt: userProfile.createdAt
        });

    } catch (error) {
        console.error('Lỗi khi tạo hồ sơ:', error);
        res.status(500).send({ message: 'Lỗi server', error: error.message });
    }
};