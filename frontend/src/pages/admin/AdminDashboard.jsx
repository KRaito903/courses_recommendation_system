// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalCourses: 0,
        totalEnrollments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is admin
        if (!currentUser) {
            navigate('/auth');
            return;
        }

        fetchDashboardStats();
    }, [currentUser]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = await currentUser.getIdToken();
            
            // Fetch stats from API
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const dashboardCards = [
        {
            title: 'Quản Lý Users',
            icon: '👥',
            count: stats.totalUsers,
            color: '#667eea',
            description: 'Quản lý tài khoản người dùng',
            path: '/admin/users'
        },
        {
            title: 'Quản Lý Students',
            icon: '🎓',
            count: stats.totalStudents,
            color: '#f093fb',
            description: 'Quản lý thông tin sinh viên',
            path: '/admin/students'
        },
        {
            title: 'Quản Lý Courses',
            icon: '📚',
            count: stats.totalCourses,
            color: '#4facfe',
            description: 'Quản lý môn học',
            path: '/admin/courses'
        },
        {
            title: 'Quản Lý Enrollments',
            icon: '📝',
            count: stats.totalEnrollments,
            color: '#fa709a',
            description: 'Quản lý đăng ký môn học',
            path: '/admin/enrollments'
        },
        {
            title: 'Quản Lý Model',
            icon: '🤖',
            count: '—',
            color: '#43e97b',
            description: 'Train và quản lý AI model',
            path: '/admin/model'
        }
    ];

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>🎛️ Admin Dashboard</h1>
                <p>Quản lý hệ thống và dữ liệu</p>
            </div>

            <div className="dashboard-grid">
                {dashboardCards.map((card, index) => (
                    <div
                        key={index}
                        className="dashboard-card"
                        style={{
                            background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`
                        }}
                        onClick={() => navigate(card.path)}
                    >
                        <div className="card-icon">{card.icon}</div>
                        <div className="card-content">
                            <h3>{card.title}</h3>
                            <div className="card-count">{card.count}</div>
                            <p>{card.description}</p>
                        </div>
                        <div className="card-arrow">→</div>
                    </div>
                ))}
            </div>

            <div className="admin-info-section">
                <div className="info-card">
                    <h3>📊 Thống Kê Tổng Quan</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Tổng Users</span>
                            <span className="stat-value">{stats.totalUsers}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tổng Students</span>
                            <span className="stat-value">{stats.totalStudents}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tổng Courses</span>
                            <span className="stat-value">{stats.totalCourses}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Tổng Enrollments</span>
                            <span className="stat-value">{stats.totalEnrollments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
