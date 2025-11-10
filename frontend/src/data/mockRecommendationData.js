// src/data/mockRecommendationData.js
/**
 * Mock data for course recommendations system
 * Used for development and testing before backend integration
 */

// ==================== Course Data Structure ====================
export const mockCourses = [
    // Foundation Courses (Semester 1)
    {
        course_id: 1,
        course_code: 'CSC00001',
        course_name: 'Introduction to Programming',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 1,
        description: 'Học lập trình cơ bản với Python: biến, hàm, vòng lặp, điều kiện.',
        prerequisites: [],
        weights: {
            logic: 0.25,
            coding: 0.45,
            math: 0.15,
            analysis: 0.15
        }
    },
    {
        course_id: 2,
        course_code: 'MAT00001',
        course_name: 'Calculus I',
        course_major_code: 'Toán học',
        credit: 4,
        semester: 1,
        description: 'Tính toán vi phân: giới hạn, đạo hàm, ứng dụng của đạo hàm.',
        prerequisites: [],
        weights: {
            logic: 0.1,
            coding: 0.05,
            math: 0.75,
            analysis: 0.1
        }
    },

    // Semester 2 Courses
    {
        course_id: 3,
        course_code: 'CSC00002',
        course_name: 'Data Structures',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 2,
        description: 'Học về cấu trúc dữ liệu: array, linked list, stack, queue, tree, graph.',
        prerequisites: ['CSC00001'],
        weights: {
            logic: 0.3,
            coding: 0.4,
            math: 0.15,
            analysis: 0.15
        }
    },
    {
        course_id: 4,
        course_code: 'CSC00003',
        course_name: 'Object-Oriented Programming',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 2,
        description: 'Lập trình hướng đối tượng: classes, inheritance, polymorphism, interfaces.',
        prerequisites: ['CSC00001'],
        weights: {
            logic: 0.25,
            coding: 0.5,
            math: 0.1,
            analysis: 0.15
        }
    },
    {
        course_id: 5,
        course_code: 'MAT00002',
        course_name: 'Linear Algebra',
        course_major_code: 'Toán học',
        credit: 4,
        semester: 2,
        description: 'Ma trận, vector, không gian vectơ, giá trị riêng, ứng dụng trong ML.',
        prerequisites: ['MAT00001'],
        weights: {
            logic: 0.1,
            coding: 0.1,
            math: 0.7,
            analysis: 0.1
        }
    },
    {
        course_id: 6,
        course_code: 'CSC00004',
        course_name: 'Web Development Basics',
        course_major_code: 'Kỹ năng',
        credit: 3,
        semester: 2,
        description: 'HTML, CSS, JavaScript: xây dựng trang web tĩnh và động.',
        prerequisites: ['CSC00001'],
        weights: {
            logic: 0.15,
            coding: 0.6,
            math: 0.1,
            analysis: 0.15
        }
    },

    // Semester 3 Courses
    {
        course_id: 7,
        course_code: 'CSC00005',
        course_name: 'Algorithms & Complexity',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 3,
        description: 'Phân tích thuật toán: Big O, sorting, searching, graph algorithms.',
        prerequisites: ['CSC00002'],
        weights: {
            logic: 0.3,
            coding: 0.3,
            math: 0.3,
            analysis: 0.1
        }
    },
    {
        course_id: 8,
        course_code: 'CSC00006',
        course_name: 'Database Systems',
        course_major_code: 'Cơ sở ngành',
        credit: 3,
        semester: 3,
        description: 'Thiết kế DB: SQL, normalization, transactions, indexing.',
        prerequisites: ['CSC00002'],
        weights: {
            logic: 0.25,
            coding: 0.35,
            math: 0.15,
            analysis: 0.25
        }
    },
    {
        course_id: 9,
        course_code: 'CSC00007',
        course_name: 'Discrete Mathematics',
        course_major_code: 'Toán học',
        credit: 3,
        semester: 3,
        description: 'Logic, set theory, combinatorics, graph theory.',
        prerequisites: [],
        weights: {
            logic: 0.4,
            coding: 0.1,
            math: 0.4,
            analysis: 0.1
        }
    },

    // Semester 4 Courses (Advanced)
    {
        course_id: 10,
        course_code: 'CSC00008',
        course_name: 'System Design',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 4,
        description: 'Thiết kế hệ thống: scalability, performance, distributed systems.',
        prerequisites: ['CSC00006', 'CSC00005'],
        weights: {
            logic: 0.2,
            coding: 0.3,
            math: 0.15,
            analysis: 0.35
        }
    },
    {
        course_id: 11,
        course_code: 'CSC00009',
        course_name: 'Machine Learning Basics',
        course_major_code: 'AI/ML',
        credit: 4,
        semester: 4,
        description: 'Supervised learning, regression, classification, model evaluation.',
        prerequisites: ['MAT00002', 'CSC00002'],
        weights: {
            logic: 0.2,
            coding: 0.3,
            math: 0.35,
            analysis: 0.15
        }
    },
    {
        course_id: 12,
        course_code: 'CSC00010',
        course_name: 'Graph Neural Networks',
        course_major_code: 'AI/ML',
        credit: 4,
        semester: 4,
        description: 'GNN architecture, node embedding, graph convolution networks.',
        prerequisites: ['CSC00009', 'MAT00002'],
        weights: {
            logic: 0.25,
            coding: 0.25,
            math: 0.35,
            analysis: 0.15
        }
    },
];

// ==================== Profile-Based Recommendations ====================
export const mockProfileBasedRecommendations = [
    {
        course_id: 3,
        course_code: 'CSC00002',
        course_name: 'Data Structures',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 2,
        matchScore: 0.92,
        reason: 'Kỳ tiếp theo theo lộ trình học của bạn',
        description: 'Học về các cấu trúc dữ liệu cơ bản như mảng, danh sách liên kết, cây, đồ thị.',
        prerequisites: ['CSC00001'],
        weights: {
            logic: 0.3,
            coding: 0.4,
            math: 0.15,
            analysis: 0.15
        }
    },
    {
        course_id: 7,
        course_code: 'CSC00005',
        course_name: 'Algorithms & Complexity',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 3,
        matchScore: 0.85,
        reason: 'Phù hợp với điểm số cao và thành tích học tập của bạn',
        description: 'Phân tích và thiết kế thuật toán tối ưu cho các bài toán khác nhau.',
        prerequisites: ['CSC00002'],
        weights: {
            logic: 0.3,
            coding: 0.3,
            math: 0.3,
            analysis: 0.1
        }
    },
    {
        course_id: 8,
        course_code: 'CSC00006',
        course_name: 'Database Systems',
        course_major_code: 'Cơ sở ngành',
        credit: 3,
        semester: 3,
        matchScore: 0.78,
        reason: 'Bổ sung kỹ năng cần thiết cho lộ trình phát triển phần mềm',
        description: 'Thiết kế và quản lý cơ sở dữ liệu quan hệ, SQL, normalization.',
        prerequisites: ['CSC00002'],
        weights: {
            logic: 0.25,
            coding: 0.35,
            math: 0.15,
            analysis: 0.25
        }
    },
    {
        course_id: 11,
        course_code: 'CSC00009',
        course_name: 'Machine Learning Basics',
        course_major_code: 'AI/ML',
        credit: 4,
        semester: 4,
        matchScore: 0.72,
        reason: 'Mở rộng kỹ năng vào lĩnh vực AI/ML',
        description: 'Supervised learning, regression, classification, model evaluation.',
        prerequisites: ['MAT00002', 'CSC00002'],
        weights: {
            logic: 0.2,
            coding: 0.3,
            math: 0.35,
            analysis: 0.15
        }
    },
];

// ==================== Collaborative Recommendations ====================
export const mockCollaborativeRecommendations = [
    {
        course_id: 4,
        course_code: 'CSC00003',
        course_name: 'Object-Oriented Programming',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 2,
        matchScore: 0.88,
        reason: 'Người dùng có hồ sơ tương tự (GPA 3.5+) đã học thành công',
        description: 'Lập trình hướng đối tượng với Java: classes, inheritance, polymorphism.',
        prerequisites: ['CSC00001'],
        weights: {
            logic: 0.25,
            coding: 0.5,
            math: 0.1,
            analysis: 0.15
        }
    },
    {
        course_id: 5,
        course_code: 'MAT00002',
        course_name: 'Linear Algebra',
        course_major_code: 'Toán học',
        credit: 4,
        semester: 2,
        matchScore: 0.81,
        reason: 'Hỗ trợ cho ML courses được học bởi người dùng tương tự',
        description: 'Ma trận, vector, không gian vectơ, giá trị riêng, ứng dụng ML.',
        prerequisites: ['MAT00001'],
        weights: {
            logic: 0.1,
            coding: 0.1,
            math: 0.7,
            analysis: 0.1
        }
    },
    {
        course_id: 9,
        course_code: 'CSC00007',
        course_name: 'Discrete Mathematics',
        course_major_code: 'Toán học',
        credit: 3,
        semester: 3,
        matchScore: 0.76,
        reason: 'Bước tiếp theo trong hành trình học của những người tương tự',
        description: 'Logic, set theory, combinatorics, graph theory fundamentals.',
        prerequisites: [],
        weights: {
            logic: 0.4,
            coding: 0.1,
            math: 0.4,
            analysis: 0.1
        }
    },
    {
        course_id: 10,
        course_code: 'CSC00008',
        course_name: 'System Design',
        course_major_code: 'Cơ sở ngành',
        credit: 4,
        semester: 4,
        matchScore: 0.69,
        reason: 'Nâng cao kỹ năng thiết kế hệ thống như các người dùng có mục tiêu tương tự',
        description: 'Thiết kế hệ thống lớn, scalability, performance optimization.',
        prerequisites: ['CSC00006', 'CSC00005'],
        weights: {
            logic: 0.2,
            coding: 0.3,
            math: 0.15,
            analysis: 0.35
        }
    },
];

// ==================== Recommendation Explanation ====================
export const mockRecommendationExplanation = {
    course_id: 3,
    course_code: 'CSC00002',
    course_name: 'Data Structures',
    matchScore: 0.92,
    factors: [
        {
            factor: 'Sequential Learning',
            weight: 0.35,
            description: 'Đây là bước tiếp theo tự nhiên sau Introduction to Programming'
        },
        {
            factor: 'Skill Match',
            weight: 0.25,
            description: 'Kỹ năng logic của bạn (0.8/1.0) phù hợp với yêu cầu của môn học'
        },
        {
            factor: 'Performance History',
            weight: 0.2,
            description: 'Bạn đã đạt điểm A trong môn tiên quyết'
        },
        {
            factor: 'Similar Students',
            weight: 0.2,
            description: '92% sinh viên có hồ sơ tương tự đã hoàn thành thành công'
        }
    ]
};

// ==================== Graph Data ====================
export const mockGraphData = {
    course_id: 3,
    nodes: [
        {
            id: 'user',
            label: 'Bạn',
            type: 'user',
            size: 30,
            color: '#4f46e5'
        },
        {
            id: 'course',
            label: 'Data Structures',
            type: 'target_course',
            size: 28,
            color: '#10b981'
        },
        {
            id: 'prereq1',
            label: 'Intro to Programming',
            type: 'prerequisite',
            size: 20,
            color: '#f59e0b'
        },
        {
            id: 'followup1',
            label: 'Algorithms',
            type: 'followup',
            size: 18,
            color: '#06b6d4'
        },
        {
            id: 'followup2',
            label: 'Database Systems',
            type: 'followup',
            size: 18,
            color: '#06b6d4'
        },
        {
            id: 'skill1',
            label: 'Logic',
            type: 'skill',
            size: 18,
            color: '#8b5cf6'
        },
        {
            id: 'skill2',
            label: 'Coding',
            type: 'skill',
            size: 18,
            color: '#8b5cf6'
        },
        {
            id: 'skill3',
            label: 'Analysis',
            type: 'skill',
            size: 18,
            color: '#8b5cf6'
        }
    ],
    edges: [
        { from: 'user', to: 'course', weight: 0.9, label: 'Recommended' },
        { from: 'prereq1', to: 'course', weight: 0.95, label: 'Prerequisite' },
        { from: 'course', to: 'followup1', weight: 0.8, label: 'Foundation For' },
        { from: 'course', to: 'followup2', weight: 0.7, label: 'Foundation For' },
        { from: 'course', to: 'skill1', weight: 0.7, label: 'Teaches' },
        { from: 'course', to: 'skill2', weight: 0.8, label: 'Teaches' },
        { from: 'course', to: 'skill3', weight: 0.6, label: 'Teaches' },
        { from: 'user', to: 'skill1', weight: 0.85, label: 'Has' },
        { from: 'user', to: 'skill2', weight: 0.8, label: 'Has' },
    ]
};

// ==================== User Similarity Data ====================
export const mockSimilarUsers = [
    {
        similar_user_id: 'user001',
        similarity_score: 0.92,
        shared_courses: 3,
        gpa_difference: 0.1,
        common_interests: ['ML', 'Web Development']
    },
    {
        similar_user_id: 'user002',
        similarity_score: 0.87,
        shared_courses: 2,
        gpa_difference: 0.2,
        common_interests: ['Algorithms', 'System Design']
    },
];

export default {
    mockCourses,
    mockProfileBasedRecommendations,
    mockCollaborativeRecommendations,
    mockRecommendationExplanation,
    mockGraphData,
    mockSimilarUsers
};
