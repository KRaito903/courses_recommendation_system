// src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './AdminUsers.css';

const AdminUsers = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/auth');
            return;
        }
        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = await currentUser.getIdToken();
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userUid) => {
        try {
            const token = await currentUser.getIdToken();
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userUid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            alert('✅ User deleted successfully!');
            fetchUsers();
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('❌ Failed to delete user: ' + err.message);
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.email?.toLowerCase().includes(searchLower) ||
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.uid?.toLowerCase().includes(searchLower)
        );
    });

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
                <div>
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/admin')}
                    >
                        ← Quay lại Dashboard
                    </button>
                    <h1>👥 Quản Lý Users</h1>
                    <p>Tổng số: {users.length} users</p>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Tìm kiếm user (email, tên, UID)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="result-count">
                    Hiển thị {filteredUsers.length} / {users.length} users
                </span>
            </div>

            {/* Users Table */}
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Display Name</th>
                            <th>UID</th>
                            <th>Email Verified</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-email">
                                        {user.email}
                                    </div>
                                </td>
                                <td>{user.displayName || '—'}</td>
                                <td>
                                    <code className="uid-code">{user.id}</code>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                                        {user.emailVerified ? '✅ Verified' : '❌ Unverified'}
                                    </span>
                                </td>
                                <td>
                                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-view"
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setSelectedUser(user);
                                            }}
                                        >
                                            👁️ Xem
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setSelectedUser(user);
                                            }}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="empty-state">
                        <p>Không tìm thấy user nào</p>
                    </div>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && !showDeleteModal && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi Tiết User</h2>
                            <button className="close-btn" onClick={() => setSelectedUser(null)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{selectedUser.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Display Name:</span>
                                <span className="detail-value">{selectedUser.displayName || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">UID:</span>
                                <code className="detail-value">{selectedUser.id}</code>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email Verified:</span>
                                <span className="detail-value">
                                    {selectedUser.emailVerified ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Created At:</span>
                                <span className="detail-value">
                                    {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Last Login:</span>
                                <span className="detail-value">
                                    {selectedUser.lastLogin 
                                        ? new Date(selectedUser.lastLogin).toLocaleString('vi-VN')
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚠️ Xác Nhận Xóa User</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem', color: '#dc2626', fontWeight: 600 }}>
                                Bạn có chắc chắn muốn xóa user này?
                            </p>
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{selectedUser.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Display Name:</span>
                                <span className="detail-value">{selectedUser.displayName || '—'}</span>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#dc2626' }}>
                                ⚠️ Hành động này không thể hoàn tác!
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedUser(null);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-confirm-delete"
                                onClick={() => handleDeleteUser(selectedUser.id)}
                            >
                                🗑️ Xóa User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
