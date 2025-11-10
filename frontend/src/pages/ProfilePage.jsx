// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as profileService from '../services/profileService.js';
import { getStudentCourses } from '../services/courseService.js';

const ProfilePage = () => {
    const { currentUser, student } = useAuth();
    const [editingDisplayName, setEditingDisplayName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState(student?.user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New: Student info editing states
    const [editingStudentInfo, setEditingStudentInfo] = useState(false);
    const [studentInfoData, setStudentInfoData] = useState({
        gpa: student?.student?.gpa || '',
        semester: student?.student?.semester || '',
        student_major_code: student?.student?.student_major_code || ''
    });

    const formatDate = (value) => {
        if (!value) return 'Chưa cập nhật';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Chưa cập nhật';
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    const handleSaveDisplayName = async () => {
        if (!newDisplayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }

        if (newDisplayName === student?.user?.displayName) {
            setError('Display name is the same as current');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = await currentUser.getIdToken();
            await profileService.updateProfile(
                    token,
                    { displayName: newDisplayName.trim() }
            );

            setSuccess('✅ Display name updated successfully!');
            setEditingDisplayName(false);
            // Reload to reflect changes
            await currentUser.reload();
            window.location.reload();
        } catch (err) {
            console.error('❌ Error updating display name:', err);
            setError(err.message || 'Failed to update display name');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setNewDisplayName(student?.user?.displayName || '');
        setEditingDisplayName(false);
        setError('');
        setSuccess('');
    };

    // New: Handle student info save
    const handleSaveStudentInfo = async () => {
        // Validation
        const gpa = parseFloat(studentInfoData.gpa);
        const semester = parseInt(studentInfoData.semester);

        if (isNaN(gpa) || gpa < 0 || gpa > 10) {
            setError('GPA must be between 0 and 10');
            return;
        }

        if (isNaN(semester) || semester < 1 || semester > 12) {
            setError('Semester must be between 1 and 12');
            return;
        }

        if (!studentInfoData.student_major_code.trim()) {
            setError('Major code cannot be empty');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = await currentUser.getIdToken();
            await profileService.updateStudent(
                token,
                student?.student?.id,
                {
                    gpa: gpa,
                    semester: semester,
                    student_major_code: studentInfoData.student_major_code.trim()
                }
            );

            setSuccess('✅ Student info updated successfully!');
            setEditingStudentInfo(false);
            window.location.reload();
        } catch (err) {
            console.error('❌ Error updating student info:', err);
            setError(err.message || 'Failed to update student info');
        } finally {
            setLoading(false);
        }
    };

    // New: Handle cancel student info edit
    const handleCancelStudentInfo = () => {
        setStudentInfoData({
            gpa: student?.student?.gpa || '',
            semester: student?.student?.semester || '',
            student_major_code: student?.student?.student_major_code || ''
        });
        setEditingStudentInfo(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="container">
            <h1>👤 Thông Tin Cá Nhân</h1>
            {currentUser ? (
                <div className="card">
                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#991b1b',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            backgroundColor: '#dcfce7',
                            border: '1px solid #86efac',
                            color: '#166534',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: '500'
                        }}>
                            {success}
                        </div>
                    )}
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
                            {student?.user?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>                    <div style={{ display: 'grid', gap: '1rem' }}>
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
                            {editingDisplayName ? (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={newDisplayName}
                                        onChange={(e) => setNewDisplayName(e.target.value)}
                                        placeholder="Enter new display name"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSaveDisplayName}
                                        disabled={loading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? '⏳' : '✅'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#f3f4f6',
                                            color: 'var(--text-dark)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                        {student?.user?.displayName || 'Not set'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setEditingDisplayName(true);
                                            setNewDisplayName(student?.user?.displayeName || '');
                                            setError('');
                                            setSuccess('');
                                        }}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            )}
                        </div>

                         <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Ngày tạo:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                {formatDate(student?.user?.createdAt)}
                            </p>
                        </div>

                        {/* New: Student Info Section */}
                        <div style={{ 
                            gridColumn: '1 / -1',
                            borderTop: '2px solid var(--border-color)',
                            paddingTop: '1.5rem',
                            marginTop: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>📊 Thông Tin Học Tập</h3>
                                {!editingStudentInfo && (
                                    <button
                                        onClick={() => {
                                            setEditingStudentInfo(true);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        ✏️ Edit All
                                    </button>
                                )}
                            </div>

                            {editingStudentInfo ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {/* GPA Input */}
                                    <div>
                                        <label style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600' }}>GPA (0-4):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="4"
                                            step="0.01"
                                            value={studentInfoData.gpa}
                                            onChange={(e) => setStudentInfoData({...studentInfoData, gpa: e.target.value})}
                                            placeholder="Enter GPA"
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                marginTop: '0.25rem'
                                            }}
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Semester Input */}
                                    <div>
                                        <label style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600' }}>Semester (1-12):</label>
                                        <select
                                            value={studentInfoData.semester}
                                            onChange={(e) => setStudentInfoData({...studentInfoData, semester: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                marginTop: '0.25rem'
                                            }}
                                            disabled={loading}
                                        >
                                            <option value="">-- Select Semester --</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Major Code Input */}
                                    <div>
                                        <label style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600' }}>Chuyên Ngành:</label>
                                        <select
                                            value={studentInfoData.student_major_code}
                                            onChange={(e) => setStudentInfoData({...studentInfoData, student_major_code: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                marginTop: '0.25rem'
                                            }}
                                            disabled={loading}
                                        >
                                            <option value="">-- Chọn Chuyên Ngành --</option>
                                            <option value="MMT hướng ATTT">MMT hướng ATTT</option>
                                            <option value="MMT">MMT</option>
                                            <option value="HTTT">HTTT</option>
                                            <option value="KTPM">KTPM</option>
                                            <option value="KHMT hướng TTNT">KHMT hướng TTNT</option>
                                            <option value="CNTThuc">CNTThuc</option>
                                            <option value="TGMT">TGMT</option>
                                            <option value="KHDL">KHDL</option>
                                            <option value="ATTT">ATTT</option>
                                            <option value="CNTTin">CNTTin</option>
                                        </select>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={handleSaveStudentInfo}
                                            disabled={loading}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem 1rem',
                                                backgroundColor: 'var(--primary-color)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontWeight: '600',
                                                opacity: loading ? 0.6 : 1
                                            }}
                                        >
                                            {loading ? '⏳ Saving...' : '✅ Save'}
                                        </button>
                                        <button
                                            onClick={handleCancelStudentInfo}
                                            disabled={loading}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#f3f4f6',
                                                color: 'var(--text-dark)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontWeight: '600',
                                                opacity: loading ? 0.6 : 1
                                            }}
                                        >
                                            ✕ Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: '600' }}>GPA</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                            {student?.student?.gpa || 'N/A'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: '600' }}>Kỳ Học</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                            {student?.student?.semester || 'N/A'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: '600' }}>Chuyên Ngành</p>
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                                            {student?.student?.student_major_code || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            )}
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
