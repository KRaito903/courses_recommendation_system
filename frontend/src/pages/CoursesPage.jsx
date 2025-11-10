// src/pages/CoursesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as courseService from '../services/courseService.js';
import './CoursesPage.css';

const CoursesPage = () => {
    const { currentUser, student } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [formData, setFormData] = useState({
        course_id: '',
        type: 'will_enroll'
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [editType, setEditType] = useState('will_enroll');
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('all');

    // Fetch student's enrolled courses
    useEffect(() => {
        if (!currentUser || !student) {
            return;
        }


        console.log('📥 Fetching enrolled courses for student:', student);

        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError('');
                const token = await currentUser.getIdToken();
                const studentCourses = await courseService.getStudentCourses(token, student.student.id);

                // Filter out undefined courses
                const validCourses = studentCourses.filter(course => course && course.course_id !== undefined);
                setCourses(validCourses);
                
                console.log('✅ Courses loaded:', validCourses.length);
            } catch (err) {
                console.error('❌ Error fetching courses:', err);
                setError(err.message || 'Failed to fetch courses');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [currentUser, student]);

    // Fetch all available courses when user opens add form
    useEffect(() => {
        if (!showAddForm || !currentUser) {
            return;
        }

        const fetchAllCourses = async () => {
            console.log('📥 Fetching all available courses for adding...');
            console.log('Student: ', student);
            try {
                const token = await currentUser.getIdToken();
                const allCourses = await courseService.getAllCourses(token);
                // Course difference exits courses already enrolled
                const enrolledCourseIds = new Set(courses.map(c => c.course_id));
                const filteredCourses = allCourses.filter(c => !enrolledCourseIds.has(c.course_id));
                setAvailableCourses(filteredCourses || []);
            } catch (err) {
                console.error('❌ Error fetching available courses:', err);
                setAvailableCourses([]);
            }
        };

        fetchAllCourses();
    }, [showAddForm, currentUser]);

    // Handle add course form submission
    const handleAddCourse = async (e) => {
        e.preventDefault();

        if (!formData.course_id) {
            setError('Please select a course');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const token = await currentUser.getIdToken();
            const newEnrollment = await courseService.createEnrollment(
                token,
                student.student.id,
                Number(formData.course_id),
                formData.type
            );

            console.log('✅ Enrollment created:', newEnrollment);

            // Refresh courses list
            const updatedCourses = await courseService.getStudentCourses(token, student.student.id);
            const validCourses = updatedCourses.filter(course => course && course.course_id !== undefined);
            setCourses(validCourses);

            // Reset form and close
            setFormData({ course_id: '', type: 'will_enroll' });
            setShowAddForm(false);

            alert('✅ Course added successfully!');
        } catch (err) {
            console.error('❌ Error adding course:', err);
            setError(err.message || 'Failed to add course');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle update course rating
    const handleUpdateCourse = async () => {
        if (!selectedCourse || !editType) {
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const token = await currentUser.getIdToken();
            const updatedEnrollment = await courseService.updateEnrollment(
                token,
                student.student.id,
                selectedCourse.course_id,
                editType
            );

            console.log('✅ Enrollment updated:', updatedEnrollment);

            // Refresh courses list
            const updatedCourses = await courseService.getStudentCourses(token, student.student.id);
            const validCourses = updatedCourses.filter(course => course && course.course_id !== undefined);
            setCourses(validCourses);

            // Update selected course and close edit mode
            setSelectedCourse({ ...selectedCourse, type: editType });
            setEditingCourseId(null);

            alert('✅ Course rating updated successfully!');
        } catch (err) {
            console.error('❌ Error updating course:', err);
            setError(err.message || 'Failed to update course');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete course
    const handleDeleteCourse = async () => {
        if (!selectedCourse || !window.confirm('Are you sure you want to delete this course?')) {
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const token = await currentUser.getIdToken();
            await courseService.deleteEnrollment(
                token,
                student.student.id,
                selectedCourse.course_id
            );

            console.log('✅ Course deleted');

            // Refresh courses list
            const updatedCourses = await courseService.getStudentCourses(token, student.student.id);
            const validCourses = updatedCourses.filter(course => course && course.course_id !== undefined);
            setCourses(validCourses);

            // Close modal
            setSelectedCourse(null);

            alert('✅ Course deleted successfully!');
        } catch (err) {
            console.error('❌ Error deleting course:', err);
            setError(err.message || 'Failed to delete course');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter and search courses
    const filteredCourses = courses.filter(course => {
        // Search filter
        const matchesSearch = !searchTerm || 
            course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.course_code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Semester filter
        const matchesSemester = selectedSemester === 'all' || 
            course.semester?.toString() === selectedSemester;
        
        return matchesSearch && matchesSemester;
    });

    // Get unique semesters for filter dropdown
    const uniqueSemesters = [...new Set(courses.map(c => c.semester))].sort((a, b) => a - b);

    // Render loading state
    if (loading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading your courses...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && courses.length === 0) {
        return (
            <div className="container">
                <div className="courses-header">
                    <h1>📚 My Courses</h1>
                </div>
                <div className="error-message">
                    ❌ {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header with title and add button */}
            <div className="courses-header">
                <div>
                    <h1>📚 Môn Học Của Tôi</h1>
                    <p style={{ 
                        margin: '0.5rem 0 0 0', 
                        color: 'var(--text-light)', 
                        fontSize: '0.95rem' 
                    }}>
                        Quản lý và theo dõi các môn học bạn đã đăng ký
                    </p>
                </div>
                <button
                    className="add-course-btn"
                    onClick={() => setShowAddForm(true)}
                    disabled={!student}
                >
                    ➕ Thêm Môn Học
                </button>
            </div>

            {/* Search and Filter Bar */}
            {courses.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm môn học (tên hoặc mã môn)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '0.95rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    
                    <div style={{ flex: '0 1 200px' }}>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '0.95rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">🗓️ Tất cả học kỳ</option>
                            {uniqueSemesters.map(sem => (
                                <option key={sem} value={sem}>
                                    Học kỳ {sem}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(searchTerm || selectedSemester !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedSemester('all');
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.9rem',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: '#64748b',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                            }}
                        >
                            ✕ Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* Statistics Summary */}
            {courses.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            📊 Tổng Số Môn
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                            {courses.length}
                        </div>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            👍 Yêu Thích
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                            {courses.filter(c => c.type === 'liked').length}
                        </div>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            📝 Sẽ Đăng Ký
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                            {courses.filter(c => c.type === 'will_enroll').length}
                        </div>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            👎 Không Thích
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                            {courses.filter(c => c.type === 'disliked').length}
                        </div>
                    </div>
                </div>
            )}

            {/* Error message if any */}
            {error && <div className="error-message">❌ {error}</div>}

            {/* Courses list or empty state */}
            {courses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📖</div>
                    <h3 className="empty-state-title">Chưa Có Môn Học</h3>
                    <p className="empty-state-text">
                        Bạn chưa đăng ký môn học nào. Nhấn "Thêm Môn Học" để bắt đầu!
                    </p>
                    <button
                        className="add-course-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        ➕ Thêm Môn Học Đầu Tiên
                    </button>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3 className="empty-state-title">Không Tìm Thấy Môn Học</h3>
                    <p className="empty-state-text">
                        Không có môn học nào khớp với từ khóa "{searchTerm}" 
                        {selectedSemester !== 'all' && ` trong học kỳ ${selectedSemester}`}.
                    </p>
                    <button
                        className="add-course-btn"
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedSemester('all');
                        }}
                    >
                        ✕ Xóa Bộ Lọc
                    </button>
                </div>
            ) : (
                <>
                    <div style={{
                        marginBottom: '1rem',
                        color: 'var(--text-light)',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}>
                        Hiển thị {filteredCourses.length} / {courses.length} môn học
                    </div>
                    <div className="courses-list">
                        {filteredCourses.map((course) => (
                        <div
                            key={course.course_id}
                            className="course-card"
                        >
                            <div className="course-card-header">
                                <h3 className="course-name">{course.course_name}</h3>
                                <span className={`course-type-badge ${course.type}`}>
                                    {course.type === 'liked' ? '👍 Yêu thích' : 
                                     course.type === 'disliked' ? '👎 Không thích' : 
                                     '📝 Sẽ đăng ký'}
                                </span>
                            </div>

                            <div className="course-card-summary">
                                <div className="course-info-item">
                                    <span className="course-info-label">🗓️ Học Kỳ</span>
                                    <span className="course-info-value">
                                        {course.semester}
                                    </span>
                                </div>
                                <div className="course-info-item">
                                    <span className="course-info-label">📋 Mã Môn</span>
                                    <span className="course-info-value">
                                        {course.course_code}
                                    </span>
                                </div>
                                <div className="course-info-item">
                                    <span className="course-info-label">📚 Tín Chỉ</span>
                                    <span className="course-info-value">
                                        {course.credit}
                                    </span>
                                </div>
                            </div>

                            <div className="course-card-action">
                                <button
                                    className="view-details-btn"
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    Xem Chi Tiết →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}

            {/* Course Details Modal */}
            {selectedCourse && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedCourse(null)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedCourse.course_name}
                            </h2>
                            <button
                                className="close-btn"
                                onClick={() => setSelectedCourse(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-group">
                                <span className="detail-label">📋 Mã Môn Học</span>
                                <span className="detail-value">
                                    {selectedCourse.course_code}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">📚 Số Tín Chỉ</span>
                                <span className="detail-value">
                                    {selectedCourse.credit}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">🗓️ Học Kỳ</span>
                                <span className="detail-value">
                                    Kỳ {selectedCourse.semester}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">🎓 Chuyên Ngành</span>
                                <span className="detail-value">
                                    {selectedCourse.course_major_code}
                                </span>
                            </div>

                            {/* Edit Rating Section */}
                            <div className="detail-group">
                                {editingCourseId === selectedCourse.course_id ? (
                                    <div>
                                        <span className="detail-label">⭐ Chỉnh Sửa Đánh Giá</span>
                                        <select
                                            className="form-select"
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                        >
                                            <option value="will_enroll">📝 Sẽ đăng ký</option>
                                            <option value="liked">👍 Yêu thích</option>
                                            <option value="disliked">👎 Không thích</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="detail-label">⭐ Đánh Giá Của Bạn</span>
                                        <span className={`course-type-badge ${selectedCourse.type}`}>
                                            {selectedCourse.type === 'liked' ? '👍 Yêu thích' : 
                                             selectedCourse.type === 'disliked' ? '👎 Không thích' : 
                                             '📝 Sẽ đăng ký'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="modal-actions">
                                {editingCourseId === selectedCourse.course_id ? (
                                    <>
                                        <button
                                            className="btn-primary"
                                            onClick={handleUpdateCourse}
                                            disabled={submitting}
                                        >
                                            {submitting ? '⏳ Đang lưu...' : '✅ Lưu Thay Đổi'}
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => {
                                                setEditingCourseId(null);
                                                setEditType(selectedCourse.type);
                                            }}
                                            disabled={submitting}
                                        >
                                            ✕ Hủy
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                setEditingCourseId(selectedCourse.course_id);
                                                setEditType(selectedCourse.type);
                                            }}
                                            disabled={submitting}
                                        >
                                            ✏️ Sửa Đánh Giá
                                        </button>
                                        <button
                                            className="btn-danger"
                                            onClick={handleDeleteCourse}
                                            disabled={submitting}
                                        >
                                            {submitting ? '⏳ Đang xóa...' : '🗑️ Xóa Môn'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Course Form Modal */}
            {showAddForm && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowAddForm(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">➕ Add New Course</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowAddForm(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddCourse}>
                            <div className="form-group">
                                <label className="form-label">📚 Chọn Môn Học</label>
                                <select
                                    className="form-select"
                                    value={formData.course_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            course_id: e.target.value
                                        })
                                    }
                                    required
                                >
                                    <option value="">-- Chọn môn học --</option>
                                    {availableCourses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.course_name} ({course.course_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">⭐ Đánh Giá</label>
                                <select
                                    className="form-select"
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target.value
                                        })
                                    }
                                >
                                    <option value="will_enroll">📝 Sẽ đăng ký</option>
                                    <option value="liked">👍 Yêu thích</option>
                                    <option value="disliked">👎 Không thích</option>
                                </select>
                            </div>

                            {error && (
                                <div className="error-message">{error}</div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? '⏳ Đang thêm...' : '✨ Thêm Môn Học'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddForm(false)}
                                    disabled={submitting}
                                >
                                    ✕ Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursesPage;
