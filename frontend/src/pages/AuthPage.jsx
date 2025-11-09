// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { register, login } = useAuth();
    const navigate = useNavigate();

    // State cho form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [student_code, setMssv] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                // Xử lý Login
                await login(email, password);
                console.log('✅ Đăng nhập thành công!');
                navigate('/'); // Về trang chủ
            } else {
                // Xử lý Register
                await register(email, password, student_code, displayName);
                console.log('✅ Đăng ký thành công! Đang chuyển sang trang đăng nhập...');
                // Sau khi đăng ký thành công, reset form và chuyển sang tab login
                setEmail('');
                setPassword('');
                setMssv('');
                setDisplayName('');
                setIsLogin(true); 
            }
        } catch (err) {
            console.error('❌ Lỗi:', err);
            setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">
                    {isLogin ? '🔐 Đăng nhập' : '📝 Đăng ký tài khoản'}
                </h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="auth-input-group">
                                <label className="auth-input-label">Họ và tên</label>
                                <input 
                                    type="text" 
                                    className="auth-input"
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)} 
                                    placeholder="Nguyễn Văn A" 
                                    required 
                                />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-input-label">Mã số sinh viên</label>
                                <input 
                                    type="text" 
                                    className="auth-input"
                                    value={student_code} 
                                    onChange={(e) => setMssv(e.target.value)} 
                                    placeholder="21127001" 
                                    required 
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="auth-input-group">
                        <label className="auth-input-label">Email</label>
                        <input 
                            type="email" 
                            className="auth-input"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="example@student.hcmus.edu.vn" 
                            required 
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-input-label">Mật khẩu</label>
                        <input 
                            type="password" 
                            className="auth-input"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                        />
                    </div>
                    
                    {error && <div className="error-message">❌ {error}</div>}
                    
                    <button type="submit" disabled={loading} className="auth-submit-btn">
                        {loading ? '⏳ Đang xử lý...' : (isLogin ? '🚀 Đăng nhập' : '✨ Đăng ký')}
                    </button>
                </form>
                
                <div className="auth-toggle">
                    <button onClick={() => setIsLogin(!isLogin)} className="auth-toggle-btn">
                        {isLogin ? 'Chưa có tài khoản? Đăng ký ngay →' : '← Đã có tài khoản? Đăng nhập'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;