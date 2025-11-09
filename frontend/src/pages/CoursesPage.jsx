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
        type: 'neutral'
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [editType, setEditType] = useState('neutral');
    const [deletingCourseId, setDeletingCourseId] = useState(null);

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
                setAvailableCourses(allCourses || []);
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
            setFormData({ course_id: '', type: 'neutral' });
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
                <h1>📚 My Courses</h1>
                <button
                    className="add-course-btn"
                    onClick={() => setShowAddForm(true)}
                    disabled={!student}
                >
                    ➕ Add Course
                </button>
            </div>

            {/* Error message if any */}
            {error && <div className="error-message">❌ {error}</div>}

            {/* Courses list or empty state */}
            {courses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📖</div>
                    <h3 className="empty-state-title">No Courses Yet</h3>
                    <p className="empty-state-text">
                        You haven't enrolled in any courses yet. Click "Add Course" to get started!
                    </p>
                    <button
                        className="add-course-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        ➕ Add Your First Course
                    </button>
                </div>
            ) : (
                <div className="courses-list">
                    {courses.map((course) => (
                        <div
                            key={course.course_id}
                            className="course-card"
                        >
                            <div className="course-card-header">
                                <h3 className="course-name">{course.course_name}</h3>
                                <span className={`course-type-badge ${course.type}`}>
                                    {course.type}
                                </span>
                            </div>

                            <div className="course-card-summary">
                                <div className="course-info-item">
                                    <span className="course-info-label">Semester</span>
                                    <span className="course-info-value">
                                        {course.semester}
                                    </span>
                                </div>
                                <div className="course-info-item">
                                    <span className="course-info-label">Code</span>
                                    <span className="course-info-value">
                                        {course.course_code}
                                    </span>
                                </div>
                            </div>

                            <div className="course-card-action">
                                <button
                                    className="view-details-btn"
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
                                <span className="detail-label">Course Code</span>
                                <span className="detail-value">
                                    {selectedCourse.course_code}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">Credits</span>
                                <span className="detail-value">
                                    {selectedCourse.credit}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">Semester</span>
                                <span className="detail-value">
                                    {selectedCourse.semester}
                                </span>
                            </div>

                            <div className="detail-group">
                                <span className="detail-label">Major Code</span>
                                <span className="detail-value">
                                    {selectedCourse.course_major_code}
                                </span>
                            </div>

                            {/* Edit Rating Section */}
                            <div className="detail-group">
                                {editingCourseId === selectedCourse.course_id ? (
                                    <div>
                                        <span className="detail-label">Edit Your Rating</span>
                                        <select
                                            className="form-select"
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                        >
                                            <option value="neutral">Neutral</option>
                                            <option value="liked">Liked 👍</option>
                                            <option value="disliked">Disliked 👎</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="detail-label">Your Rating</span>
                                        <span className={`course-type-badge ${selectedCourse.type}`}>
                                            {selectedCourse.type}
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
                                            {submitting ? '⏳ Saving...' : '✅ Save Changes'}
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => {
                                                setEditingCourseId(null);
                                                setEditType(selectedCourse.type);
                                            }}
                                            disabled={submitting}
                                        >
                                            Cancel
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
                                            ✏️ Edit Rating
                                        </button>
                                        <button
                                            className="btn-danger"
                                            onClick={handleDeleteCourse}
                                            disabled={submitting}
                                        >
                                            {submitting ? '⏳ Deleting...' : '🗑️ Delete'}
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
                                <label className="form-label">Select Course</label>
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
                                    <option value="">-- Choose a course --</option>
                                    {availableCourses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.course_name} ({course.course_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Rating</label>
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
                                    <option value="neutral">Neutral</option>
                                    <option value="liked">Liked 👍</option>
                                    <option value="disliked">Disliked 👎</option>
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
                                    {submitting ? '⏳ Adding...' : '✨ Add Course'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddForm(false)}
                                    disabled={submitting}
                                >
                                    Cancel
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
