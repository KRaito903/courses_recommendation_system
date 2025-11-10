// src/pages/RecommendationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './RecommendationsPage.css';

const RecommendationsPage = () => {
    const { currentUser, student } = useAuth();
    const navigate = useNavigate();
    const [profileRecommendations, setProfileRecommendations] = useState([]);
    const [collaborativeRecommendations, setCollaborativeRecommendations] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showGraphView, setShowGraphView] = useState(false);
    const [activeGraphType, setActiveGraphType] = useState(null); // 'profile-based' or 'collaborative'
    const [selectedSemester, setSelectedSemester] = useState('all'); // Filter by semester
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch recommendations from model
    useEffect(() => {
        if (!currentUser || !student) return;

        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                setError('');
                const token = await currentUser.getIdToken();

                // TODO: Replace with actual API calls
                // Profile-based recommendations
                // const profileData = await fetch(
                //     `/api/recommendations/profile-based/${student.student.id}`,
                //     { headers: { Authorization: `Bearer ${token}` } }
                // );
                
                // Collaborative recommendations
                // const collabData = await fetch(
                //     `/api/recommendations/collaborative/${student.student.id}`,
                //     { headers: { Authorization: `Bearer ${token}` } }
                // );

                // Mock data for development
                const mockProfileBased = [
                    {
                        rank: 1,
                        course_id: 1,
                        course_code: 'CSC00002',
                        course_name: 'Data Structures',
                        course_major_code: 'Cơ sở ngành',
                        credit: 4,
                        semester: 2,
                        description: 'Học về các cấu trúc dữ liệu cơ bản như mảng, danh sách liên kết, cây, đồ thị.'
                    },
                    {
                        rank: 2,
                        course_id: 2,
                        course_code: 'CSC00003',
                        course_name: 'Algorithms',
                        course_major_code: 'Cơ sở ngành',
                        credit: 4,
                        semester: 3,
                        description: 'Phân tích và thiết kế thuật toán tối ưu cho các bài toán khác nhau.'
                    },
                    {
                        rank: 3,
                        course_id: 3,
                        course_code: 'CSC00004',
                        course_name: 'Database Systems',
                        course_major_code: 'Cơ sở ngành',
                        credit: 3,
                        semester: 3,
                        description: 'Thiết kế và quản lý cơ sở dữ liệu quan hệ, SQL, normalization.'
                    },
                    {
                        rank: 4,
                        course_id: 4,
                        course_code: 'CSC00005',
                        course_name: 'Web Development',
                        course_major_code: 'Kỹ năng',
                        credit: 3,
                        semester: 2,
                        description: 'Xây dựng ứng dụng web với HTML, CSS, JavaScript.'
                    }
                ];

                const mockCollaborative = [
                    {
                        rank: 1,
                        course_id: 5,
                        course_code: 'CSC00006',
                        course_name: 'Object-Oriented Programming',
                        course_major_code: 'Cơ sở ngành',
                        credit: 4,
                        semester: 2,
                        description: 'Lập trình hướng đối tượng với Java: classes, inheritance, polymorphism.'
                    },
                    {
                        rank: 2,
                        course_id: 6,
                        course_code: 'CSC00007',
                        course_name: 'Linear Algebra',
                        course_major_code: 'Toán học',
                        credit: 4,
                        semester: 1,
                        description: 'Ma trận, vector, không gian vectơ, giá trị riêng, ứng dụng ML.'
                    },
                    {
                        rank: 3,
                        course_id: 7,
                        course_code: 'CSC00008',
                        course_name: 'System Design',
                        course_major_code: 'Cơ sở ngành',
                        credit: 4,
                        semester: 4,
                        description: 'Thiết kế hệ thống phần mềm lớn, scalability, performance.'
                    }
                ];

                // Mock enrolled courses for graph
                const mockEnrolled = [
                    { course_id: 100, course_code: 'CSC00001', course_name: 'Introduction to Programming' },
                    { course_id: 101, course_code: 'MAT00001', course_name: 'Calculus I' }
                ];

                setProfileRecommendations(mockProfileBased);
                setCollaborativeRecommendations(mockCollaborative);
                setEnrolledCourses(mockEnrolled);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError(err.message || 'Failed to fetch recommendations');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [currentUser, student]);

    const handleViewDetails = (course) => {
        setSelectedCourse(course);
        setShowDetailsModal(true);
    };

    const handleViewGraph = (type) => {
        // Open graph in new tab/window instead of modal
        const courses = type === 'profile-based' 
            ? profileRecommendations 
            : collaborativeRecommendations;
        
        // Store data in sessionStorage for new tab
        sessionStorage.setItem('graphData', JSON.stringify({
            courses: courses,
            enrolledCourses: enrolledCourses,
            graphType: type
        }));
        
        // Open in new tab
        window.open('/graph-fullscreen', '_blank');
    };

    const handleOpenFullscreenGraph = (type) => {
        // This function is now same as handleViewGraph
        handleViewGraph(type);
    };

    const closeModal = () => {
        setShowDetailsModal(false);
        setSelectedCourse(null);
    };

    const closeGraphView = () => {
        setShowGraphView(false);
        setActiveGraphType(null);
    };

    // Filter courses by semester
    const filterCoursesBySemester = (courses) => {
        if (selectedSemester === 'all') return courses;
        return courses.filter(course => course.semester.toString() === selectedSemester);
    };

    const filteredProfileRecommendations = filterCoursesBySemester(profileRecommendations);
    const filteredCollaborativeRecommendations = filterCoursesBySemester(collaborativeRecommendations);

    // Get available semesters from all recommendations
    const availableSemesters = Array.from(
        new Set([
            ...profileRecommendations.map(c => c.semester),
            ...collaborativeRecommendations.map(c => c.semester)
        ])
    ).sort((a, b) => a - b);

    return (
        <div className="recommendations-container">
            {/* Header */}
            <div className="recommendations-header">
                <h1>🤖 Gợi Ý Môn Học</h1>
                <p>Hệ thống gợi ý môn học dựa trên Graph Neural Networks</p>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-banner">
                    <span>❌ {error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải gợi ý...</p>
                </div>
            ) : (
                <>
                    {/* Semester Filter */}
                    <div className="filter-section">
                        <div className="filter-group">
                            <label htmlFor="semester-filter">🎓 Lọc theo kỳ học:</label>
                            <select
                                id="semester-filter"
                                className="semester-filter"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                            >
                                <option value="all">Tất cả kỳ học</option>
                                {availableSemesters.map(sem => (
                                    <option key={sem} value={sem}>
                                        Kỳ {sem}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-info">
                            {selectedSemester === 'all' 
                                ? `Hiển thị ${profileRecommendations.length + collaborativeRecommendations.length} môn học`
                                : `Hiển thị ${filteredProfileRecommendations.length + filteredCollaborativeRecommendations.length} môn học ở kỳ ${selectedSemester}`
                            }
                        </div>
                    </div>

                    {/* Section 1: Profile-Based Recommendations */}
                    <div className="recommendation-section">
                        <div className="section-header">
                            <h2>👤 Gợi Ý Dựa Trên Hồ Sơ Của Bạn</h2>
                            <p className="section-description">
                                Dựa trên tiến độ học tập, điểm số và thành tích của bạn
                            </p>
                            <button 
                                className="btn-view-section-graph"
                                onClick={() => handleViewGraph('profile-based')}
                                title="Xem biểu đồ liên kết cho phần này"
                            >
                                📊 Xem Biểu Đồ
                            </button>
                        </div>

                        {profileRecommendations.length === 0 ? (
                            <div className="empty-message">Chưa có gợi ý nào</div>
                        ) : filteredProfileRecommendations.length === 0 ? (
                            <div className="empty-message">
                                Không có gợi ý nào cho kỳ {selectedSemester}
                            </div>
                        ) : (
                            <div className="courses-list">
                                {filteredProfileRecommendations.map((course) => (
                                    <div key={course.course_id} className="course-item">
                                        <div className="rank-badge">#{course.rank}</div>
                                        <div className="course-info">
                                            <h3>{course.course_name}</h3>
                                            <p className="course-code">{course.course_code}</p>
                                            <p className="course-meta">
                                                <span>Kỳ {course.semester}</span> • 
                                                <span>{course.credit} tín chỉ</span> • 
                                                <span>{course.course_major_code}</span>
                                            </p>
                                        </div>
                                        <button
                                            className="btn-details"
                                            onClick={() => handleViewDetails(course)}
                                            title="Xem chi tiết"
                                        >
                                            📋 Chi Tiết
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Collaborative Recommendations */}
                    <div className="recommendation-section">
                        <div className="section-header">
                            <h2>👥 Gợi Ý Từ Người Học Tương Tự</h2>
                            <p className="section-description">
                                Dựa trên hồ sơ của những người có lộ trình học tương tự
                            </p>
                            <button 
                                className="btn-view-section-graph"
                                onClick={() => handleViewGraph('collaborative')}
                                title="Xem biểu đồ liên kết cho phần này"
                            >
                                📊 Xem Biểu Đồ
                            </button>
                        </div>

                        {collaborativeRecommendations.length === 0 ? (
                            <div className="empty-message">Chưa có gợi ý nào</div>
                        ) : filteredCollaborativeRecommendations.length === 0 ? (
                            <div className="empty-message">
                                Không có gợi ý nào cho kỳ {selectedSemester}
                            </div>
                        ) : (
                            <div className="courses-list">
                                {filteredCollaborativeRecommendations.map((course) => (
                                    <div key={course.course_id} className="course-item">
                                        <div className="rank-badge">#{course.rank}</div>
                                        <div className="course-info">
                                            <h3>{course.course_name}</h3>
                                            <p className="course-code">{course.course_code}</p>
                                            <p className="course-meta">
                                                <span>Kỳ {course.semester}</span> • 
                                                <span>{course.credit} tín chỉ</span> • 
                                                <span>{course.course_major_code}</span>
                                            </p>
                                        </div>
                                        <button
                                            className="btn-details"
                                            onClick={() => handleViewDetails(course)}
                                            title="Xem chi tiết"
                                        >
                                            📋 Chi Tiết
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedCourse && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{selectedCourse.course_name}</h2>
                                <p className="modal-code">{selectedCourse.course_code}</p>
                            </div>
                            <button className="close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            {/* Description */}
                            <div className="section">
                                <h3>� Mô Tả</h3>
                                <p>{selectedCourse.description}</p>
                            </div>

                            {/* Metadata */}
                            <div className="section">
                                <h3>ℹ️ Thông Tin Môn Học</h3>
                                <div className="metadata-grid">
                                    <div><strong>Mã Môn:</strong> {selectedCourse.course_code}</div>
                                    <div><strong>Tín Chỉ:</strong> {selectedCourse.credit}</div>
                                    <div><strong>Kỳ:</strong> {selectedCourse.semester}</div>
                                    <div><strong>Ngành:</strong> {selectedCourse.course_major_code}</div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graph Modal - Disabled: Now opens in new tab */}
            {false && showGraphView && activeGraphType && (
                <div className="modal-overlay" onClick={closeGraphView}>
                    <div className="modal-content graph-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>
                                    � Biểu Đồ Liên Kết
                                    {activeGraphType === 'profile-based' 
                                        ? ' - Gợi Ý Từ Hồ Sơ' 
                                        : ' - Gợi Ý Từ Cộng Đồng'}
                                </h2>
                                <p className="modal-code">
                                    Kết nối giữa bạn, các môn học đã học, và các môn được gợi ý
                                </p>
                            </div>
                            <button className="close-btn" onClick={closeGraphView}>✕</button>
                        </div>

                        <div className="modal-body graph-body">
                            <GraphVisualization 
                                courses={activeGraphType === 'profile-based' 
                                    ? profileRecommendations 
                                    : collaborativeRecommendations}
                                enrolledCourses={enrolledCourses}
                                graphType={activeGraphType}
                            />
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-fullscreen"
                                onClick={() => {
                                    handleOpenFullscreenGraph(activeGraphType);
                                    closeGraphView();
                                }}
                            >
                                ⛶ Xem Toàn Màn Hình
                            </button>
                            <button className="btn-secondary" onClick={closeGraphView}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;
