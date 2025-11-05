// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const HomePage = () => {
    const { currentUser } = useAuth();

    return (
        <div className="container">
            <div className="text-center" style={{ padding: '3rem 0' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {currentUser ? (
                        `👋 Chào mừng trở lại, ${currentUser.displayName || currentUser.email?.split('@')[0]}!`
                    ) : (
                        '🎓 Course Recommender System'
                    )}
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '2rem' }}>
                    Hệ thống gợi ý môn học thông minh sử dụng Graph Neural Networks
                </p>
                
                {!currentUser && (
                    <Link to="/auth">
                        <button style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                            🚀 Bắt đầu ngay
                        </button>
                    </Link>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
                <div className="card">
                    <h3>📚 Danh sách môn học</h3>
                    <p>Khám phá các môn học có sẵn trong hệ thống</p>
                    <Link to="/courses">
                        <button className="secondary" style={{ marginTop: '1rem', width: '100%' }}>
                            Xem môn học →
                        </button>
                    </Link>
                </div>

                <div className="card">
                    <h3>🤖 Gợi ý thông minh</h3>
                    <p>Nhận gợi ý môn học phù hợp dựa trên GNN</p>
                    {currentUser ? (
                        <Link to="/recommendations">
                            <button className="secondary" style={{ marginTop: '1rem', width: '100%' }}>
                                Nhận gợi ý →
                            </button>
                        </Link>
                    ) : (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '1rem', fontStyle: 'italic' }}>
                            Cần đăng nhập để sử dụng tính năng này
                        </p>
                    )}
                </div>

                <div className="card">
                    <h3>👥 Hỗ trợ</h3>
                    <p>Liên hệ với chúng tôi nếu cần hỗ trợ</p>
                    <Link to="/contact">
                        <button className="secondary" style={{ marginTop: '1rem', width: '100%' }}>
                            Liên hệ →
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;