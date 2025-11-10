// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

const Navbar = () => {
    const { currentUser, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

    const isActive = (path) => location.pathname === path ? 'navbar-link active' : 'navbar-link';

    // Get initials for avatar
    const getInitials = (name, email) => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return 'U';
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    🎓 Course Recommender
                </Link>
                
                <div className="navbar-links">
                    <Link to="/" className={isActive('/')}>Trang chủ</Link>
                    <Link to="/courses" className={isActive('/courses')}>Môn học</Link>
                    
                    {currentUser && currentUser.emailVerified && (
                        <>
                            <Link to="/recommendations" className={isActive('/recommendations')}>Gợi ý</Link>
                            <Link to="/profile" className={isActive('/profile')}>Hồ sơ</Link>
                            {isAdmin && (
                                <Link to="/admin" className={isActive('/admin')} style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                    🎛️ Admin
                                </Link>
                            )}
                        </>
                    )}
                    
                    <Link to="/contact" className={isActive('/contact')}>Liên hệ</Link>
                </div>
                
                <div className="navbar-user">
                    {currentUser ? (
                        <>
                            {currentUser.emailVerified ? (
                                <div className="navbar-user-info">
                                    <div className="navbar-user-avatar">
                                        {getInitials(currentUser.displayName, currentUser.email)}
                                    </div>
                                    <span className="navbar-user-name">
                                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                                    </span>
                                    <button onClick={handleLogout} className="navbar-logout-btn">
                                        Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <span className="navbar-warning">⚠️ Chưa xác thực email</span>
                            )}
                        </>
                    ) : (
                        <Link to="/auth" className="navbar-link">
                            Đăng nhập / Đăng ký
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;