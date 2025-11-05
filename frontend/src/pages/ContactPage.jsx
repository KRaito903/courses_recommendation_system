// src/pages/ContactPage.jsx
import React from 'react';

const ContactPage = () => {
    return (
        <div className="container">
            <h1>📞 Liên Hệ</h1>
            <div className="card">
                <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua các kênh sau:
                </p>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontSize: '2rem' }}>📧</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Email</strong>
                            <a href="mailto:support@example.com" style={{ color: 'var(--primary-color)' }}>
                                support@example.com
                            </a>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontSize: '2rem' }}>�</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Điện thoại</strong>
                            <a href="tel:+84123456789" style={{ color: 'var(--primary-color)' }}>
                                +84 123 456 789
                            </a>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontSize: '2rem' }}>📍</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Địa chỉ</strong>
                            <p style={{ margin: 0, color: 'var(--text-dark)' }}>
                                227 Nguyễn Văn Cừ, Quận 5, TP.HCM
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
