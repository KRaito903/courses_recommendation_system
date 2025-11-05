// src/components/common/AuthGuard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Nếu chưa đăng nhập, chuyển về trang /auth
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    
    // (Tùy chọn) Kiểm tra email đã verify
    if (!currentUser.emailVerified) {
        return (
            <div>
                <h2>Vui lòng xác thực email của bạn</h2>
                <p>Chúng tôi đã gửi một link đến email của bạn. Vui lòng kiểm tra (cả spam) để tiếp tục.</p>
            </div>
        );
    }

    // Nếu đã đăng nhập và xác thực, cho phép vào
    return children;
};

export default AuthGuard;