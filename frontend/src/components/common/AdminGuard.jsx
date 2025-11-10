// src/components/common/AdminGuard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const AdminGuard = ({ children }) => {
    const { currentUser, isAdmin, loading } = useAuth();

    // Wait for loading to finish
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    color: '#667eea'
                }}>
                    🔒 Đang kiểm tra quyền truy cập...
                </div>
            </div>
        );
    }

    // If not logged in, redirect to auth
    if (!currentUser) {
        return <Navigate to="/auth" replace />;
    }

    // If not admin, show access denied
    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '5rem',
                    marginBottom: '1rem'
                }}>
                    🚫
                </div>
                <h1 style={{
                    fontSize: '2rem',
                    color: '#dc2626',
                    marginBottom: '1rem'
                }}>
                    Access Denied
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#64748b',
                    marginBottom: '2rem'
                }}>
                    Bạn không có quyền truy cập trang này.<br/>
                    Chỉ Admin mới có thể truy cập.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    ← Quay về Trang Chủ
                </button>
            </div>
        );
    }

    // If admin, render children
    return children;
};

export default AdminGuard;
