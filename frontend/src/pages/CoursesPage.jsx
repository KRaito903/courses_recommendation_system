// src/pages/CoursesPage.jsx
import React from 'react';

const CoursesPage = () => {
    return (
        <div className="container">
            <h1>📚 Danh Sách Môn Học</h1>
            <div className="card">
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    Trang này sẽ hiển thị danh sách các môn học có sẵn trong hệ thống.
                </p>
                <div style={{ 
                    backgroundColor: 'var(--bg-light)', 
                    padding: '2rem', 
                    borderRadius: '12px', 
                    textAlign: 'center' 
                }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>🚧</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                        Đang phát triển
                    </p>
                    <p style={{ color: 'var(--text-light)' }}>
                        Chức năng này sẽ sớm được hoàn thành
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CoursesPage;
