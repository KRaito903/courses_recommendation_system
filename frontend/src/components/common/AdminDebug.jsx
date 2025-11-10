// src/components/common/AdminDebug.jsx
// Component để debug admin status - chỉ dùng khi development
import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const AdminDebug = () => {
    const { currentUser, userRole, isAdmin } = useAuth();

    // Only show in development
    if (import.meta.env.MODE !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#fbbf24' }}>
                🔍 Admin Debug Info
            </div>
            <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#94a3b8' }}>Logged In:</span>{' '}
                <span style={{ color: currentUser ? '#10b981' : '#ef4444' }}>
                    {currentUser ? 'Yes' : 'No'}
                </span>
            </div>
            {currentUser && (
                <>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>UID:</span>{' '}
                        <span style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                            {currentUser.uid}
                        </span>
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>Role:</span>{' '}
                        <span style={{ 
                            color: userRole === 'admin' ? '#10b981' : '#f59e0b',
                            fontWeight: 'bold'
                        }}>
                            {userRole || 'user'}
                        </span>
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: '#94a3b8' }}>Is Admin:</span>{' '}
                        <span style={{ 
                            color: isAdmin ? '#10b981' : '#ef4444',
                            fontWeight: 'bold'
                        }}>
                            {isAdmin ? 'TRUE' : 'FALSE'}
                        </span>
                    </div>
                    <div style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid #475569',
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                    }}>
                        Đăng xuất/nhập lại để refresh token
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDebug;
