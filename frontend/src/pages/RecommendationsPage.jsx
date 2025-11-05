// src/pages/RecommendationsPage.jsx
import React from 'react';

const RecommendationsPage = () => {
    return (
        <div className="container">
            <h1>🤖 Gợi Ý Môn Học</h1>
            <div className="card">
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    Hệ thống sẽ phân tích dữ liệu của bạn và đưa ra gợi ý môn học phù hợp nhất dựa trên Graph Neural Networks.
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
                        Tính năng GNN recommendation sẽ sớm được tích hợp
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RecommendationsPage;
