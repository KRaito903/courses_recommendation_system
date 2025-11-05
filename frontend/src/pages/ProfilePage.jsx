// src/pages/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const ProfilePage = () => {
    const { currentUser } = useAuth();

    return (
        <div className="container">
            <h1>👤 Thông Tin Cá Nhân</h1>
            {currentUser ? (
                <div className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: '700',
                            margin: '0 auto 1rem'
                        }}>
                            {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Email:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{currentUser.email}</p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>User ID:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-dark)', fontFamily: 'monospace' }}>{currentUser.uid}</p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Trạng thái xác thực:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem' }}>
                                {currentUser.emailVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                            </p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Tên hiển thị:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                {currentUser.displayName || 'Chưa cập nhật'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card text-center">
                    <p>⏳ Đang tải thông tin...</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
