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
    const [loading, setLoading] = useState(true);

    // Hàm đăng ký - CHỈ tạo Firebase Auth user, KHÔNG tạo profile ngay
    const register = async (email, password, student_code, displayName) => {
        try {
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
    const createUserProfile = async () => {
        if (!currentUser) {
            console.log('⚠️ Không có currentUser');
            return false;
        }

        if (!currentUser.emailVerified) {
            console.log('⚠️ User chưa verify email');
            return false;
        }

        try {
            // Kiểm tra localStorage cho pending profile data
            const pendingDataStr = localStorage.getItem(`pendingProfile_${currentUser.uid}`);
            
            if (!pendingDataStr) {
                console.log('ℹ️ Không có pending profile data');
                return false;
            }

            const profileData = JSON.parse(pendingDataStr);
            
            // Lấy token
            const token = await currentUser.getIdToken();
            
            // Gọi API tạo profile
            console.log('📝 Đang tạo profile trong Firestore...');
            await profileService.createProfile(token, profileData);
            
            // Xóa pending data sau khi tạo thành công
            localStorage.removeItem(`pendingProfile_${currentUser.uid}`);
            
            console.log('✅ Profile đã được tạo thành công!');
            alert('🎉 Chào mừng! Tài khoản của bạn đã được kích hoạt.');
            
            return true;
        } catch (error) {
            // Nếu lỗi là profile đã tồn tại → cũng OK, xóa pending data
            if (error.message?.includes('already exists') || 
                error.message?.includes('409') ||
                error.message?.includes('Document already exists')) {
                console.log('✅ Profile đã tồn tại');
                localStorage.removeItem(`pendingProfile_${currentUser.uid}`);
                return true;
            }
            
            console.error('❌ Lỗi khi tạo profile:', error);
            throw error;
        }
    };

    // Hàm đăng nhập
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Sau khi đăng nhập thành công, check và tạo profile nếu cần
        if (userCredential.user.emailVerified) {
            // Đợi một chút để currentUser được set bởi onAuthStateChanged
            setTimeout(() => {
                createUserProfile().catch(err => {
                    console.error('Error creating profile after login:', err);
                });
            }, 1000);
        }
        
        return userCredential;
    };

    // Hàm đăng xuất
    const logout = () => {
        return signOut(auth);
    };

    // Theo dõi trạng thái đăng nhập
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            // Nếu user vừa verify email và đăng nhập, tự động tạo profile
            if (user && user.emailVerified) {
                const pendingDataStr = localStorage.getItem(`pendingProfile_${user.uid}`);
                if (pendingDataStr) {
                    console.log('🔄 Phát hiện pending profile, đang tạo...');
                    try {
                        await createUserProfile();
                    } catch (error) {
                        console.error('Error auto-creating profile:', error);
                    }
                }
            }
            
            setLoading(false);
        });
        return unsubscribe; // Dọn dẹp khi unmount
    }, []);

    const value = {
        currentUser,
        loading,
        register,
        login,
        logout,
        createUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};