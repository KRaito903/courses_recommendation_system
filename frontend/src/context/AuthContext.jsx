// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../config/firebase.config.js';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    sendEmailVerification
} from 'firebase/auth';
// intentionally avoid useNavigate here because AuthProvider may be mounted outside a Router
// Import service gọi API backend
import * as profileService from '../services/profileService.js';

// 1. Tạo Context
const AuthContext = createContext();

// 2. Tạo Hook (để dễ sử dụng)
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Tạo Provider (Component bọc toàn bộ app)
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [student, setStudent] = useState(null);  // ← New: Store student
    const [userRole, setUserRole] = useState(null);  // ← New: Store user role (admin, user, etc.)
    const [loading, setLoading] = useState(true);

    // Hàm đăng ký - CHỈ tạo Firebase Auth user, KHÔNG tạo profile ngay
    const register = async (email, password, student_code, displayName) => {
        try {
            console.log("Đăng ký user với email:", email);
            // Bước 1: Tạo user ở Firebase Auth (Client)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Bước 2: Gửi email xác thực
            await sendEmailVerification(userCredential.user);
            
            // Bước 3: Lưu thông tin vào localStorage để dùng sau khi verify
            const profileData = { student_code, displayName };
            localStorage.setItem(`pendingProfile_${userCredential.user.uid}`, JSON.stringify(profileData));
            
            console.log("✅ Đăng ký thành công! User ID:", userCredential.user.uid);
            console.log("📧 Email xác thực đã được gửi. Profile sẽ được tạo sau khi verify.");
            
            alert("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.\n\nSau khi xác thực, hãy đăng nhập lại để hoàn tất.");
            
            setCurrentUser(userCredential.user);

            return userCredential;
        } catch (error) {
            console.error("❌ Lỗi khi đăng ký:", error);
            
            // Xử lý các lỗi phổ biến từ Firebase
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Email này đã được sử dụng.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Email không hợp lệ.');
            }
            
            throw error;
        }
    };

    // Hàm tạo profile - Gọi SAU KHI user đã verify email
    // Có thể truyền user object vào để tránh dependency issue
    const createUserProfile = async (user = null) => {
        const targetUser = user || currentUser;
        
        if (!targetUser) {
            console.log('⚠️ Không có user');
            return false;
        }

        if (!targetUser.emailVerified) {
            console.log('⚠️ User chưa verify email');
            return false;
        }

        try {
            // Kiểm tra localStorage cho pending profile data
            const pendingDataStr = localStorage.getItem(`pendingProfile_${targetUser.uid}`);
            
            if (!pendingDataStr) {
                console.log('ℹ️ Không có pending profile data');
                return false;
            }

            const profileData = JSON.parse(pendingDataStr);
            
            // Lấy token
            const token = await targetUser.getIdToken();

             // Xóa pending data sau khi tạo thành công
            localStorage.removeItem(`pendingProfile_${targetUser.uid}`);

            // Gọi API tạo profile
            console.log('📝 Đang tạo profile trong Firestore...');
            const response = await profileService.createProfile(token, profileData);
            
            // ✅ Extract student_id từ response và lưu vào state
            if (response && response.student) {
                setStudent(response.student);
                console.log('✅ Student ID saved:', response.student);
            }
            
            console.log('✅ Profile đã được tạo thành công!');
            alert('🎉 Chào mừng! Tài khoản của bạn đã được kích hoạt.');
            // Reload page to reflect changes
            window.location.reload();
            return true;
        } catch (error) {
            // Nếu lỗi là profile đã tồn tại → cũng OK, xóa pending data
            if (error.message?.includes('already exists') || 
                error.message?.includes('409') ||
                error.message?.includes('Document already exists')) {
                console.log('✅ Profile đã tồn tại');
                localStorage.removeItem(`pendingProfile_${targetUser.uid}`);
                return true;
            }
            
            console.error('❌ Lỗi khi tạo profile:', error);
            throw error;
        }
    };

    // Hàm đăng nhập
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Reload user để lấy trạng thái emailVerified mới nhất
        await userCredential.user.reload();

        console.log('🔄 User reloaded. EmailVerified:', userCredential.user.emailVerified);

        // Nếu email chưa verify: sign out ngay, clear currentUser và chuyển về trang auth
            if (!userCredential.user.emailVerified) {
                console.log('⚠️ Email chưa được xác thực. Đăng xuất và chuyển về trang Auth.');
                try {
                    await signOut(auth);
                } catch (err) {
                    console.error('Lỗi khi signOut unverified user:', err);
                }
                alert('⚠️ Email chưa được xác thực.\n\nVui lòng kiểm tra hộp thư đến (hoặc spam) và click vào link xác thực, sau đó đăng nhập lại.');
                // use window.location to redirect because AuthProvider may be mounted outside Router
                window.location.href = '/auth';
                throw new Error('Email not verified');
            }

        // Nếu verified, chờ một chút rồi gọi tạo profile nếu cần
        setTimeout(async () => {
            try {
                const freshUser = auth.currentUser;
                if (freshUser) {
                    await freshUser.reload();
                    await createUserProfile(freshUser);
                    const token = await userCredential.user.getIdToken();
                    const data = await profileService.getProfile(token);
                    setStudent(data);  // ← Set student from fetched profile
                }
            } catch (err) {
                console.error('Error creating profile after login:', err);
            }
        }, 800);

        return userCredential;
    };

    // Hàm đăng xuất
    const logout = () => {
        return signOut(auth);
    };

    // Theo dõi trạng thái đăng nhập
    useEffect(() => {
        console.log('🔔 Setting up onAuthStateChanged listener');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('🔔 onAuthStateChanged triggered. User:', user);
            if (user) {
                try {
                    // Reload to get latest emailVerified and custom claims
                    await user.reload();
                    const freshUser = auth.currentUser;
                    
                    // Get ID token with custom claims
                    const tokenResult = await freshUser.getIdTokenResult();
                    console.log('🔑 Custom claims:', tokenResult.claims);
                    
                    // Extract role from custom claims
                    const role = tokenResult.claims.role || 'user';
                    setUserRole(role);
                    console.log('👤 User role:', role);
                    
                    const token = await freshUser.getIdToken();
                    const data = await profileService.getProfile(token);
                    setStudent(data);  // ← Set student from fetched profile
                    // Nếu chưa verify -> sign out và redirect về /auth
                    if (!freshUser?.emailVerified) {
                        console.log('⚠️ User tồn tại nhưng chưa verify. Sign out và redirect.');
                        try {
                            await signOut(auth);
                        } catch (err) {
                            console.error('Lỗi khi signOut unverified user onAuthStateChanged:', err);
                        }
                    } else {
                        // Verified -> set session
                        setCurrentUser(freshUser);
                        console.log('👤 Verified user loaded. EmailVerified:', freshUser.emailVerified);

                        // Nếu có pending profile -> tạo
                        const pendingDataStr = localStorage.getItem(`pendingProfile_${freshUser.uid}`);
                        if (pendingDataStr) {
                            console.log('🔄 Phát hiện pending profile, đang tạo...');
                            setTimeout(async () => {
                                try {
                                    const result = await createUserProfile(freshUser);
                                    // After profile created, fetch full profile to get student_id
                                    if (result) {
                                        const pendingProfile = JSON.parse(pendingDataStr);
                                        if (pendingProfile.student_id) {
                                            setStudentId(pendingProfile.student_id);
                                            console.log('✅ Student ID loaded from pending:', pendingProfile.student_id);
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error auto-creating profile:', error);
                                }
                            }, 500);
                        } else {
                            // Profile already created, need to fetch student_id from Firestore
                            // You can implement getProfile call here if needed
                            console.log('📚 Profile already exists, fetching student_id...');
                        }
                    }
                } catch (error) {
                    console.error('Error reloading user:', error);
                    setCurrentUser(null);
                }
            } else {
                console.log('👤 No user logged in');
                setCurrentUser(null);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        student,
        userRole,
        loading,
        register,
        login,
        logout,
        createUserProfile,
        isAdmin: userRole === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};