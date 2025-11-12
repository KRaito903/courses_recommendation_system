import { getRecommendations } from '../services/model.service.js';
import { getCourseMap } from '../config/localCache.js';
import { db } from '../config/firebase.config.js';
import { getStudentsByMajorAndSemester} from '../services/student.service.js';
import { getAllEnrollments } from '../services/enrollment.service.js';



export const fetchCourseRecommendations = async (req, res) => {
    try {
        const { student_id, semester_filter, k } = req.query;
        console.log('📥 Received recommendation request for student_id:', student_id, 'semester filter:', semester_filter);
        if (!student_id) {
            return res.status(400).send({ message: 'Thiếu student_id trong yêu cầu.' });
        }
        const recommendations = await getRecommendations(student_id, semester_filter || 0, k || 10);
        const courseMap = getCourseMap();
       
        const result = JSON.parse(recommendations).map(rec => {
            const courseDetails = courseMap[rec.course_id] || {};
            return {
                course_id: rec.course_id,
                rank: rec.rank,
                course_name: courseDetails.course_name || 'Unknown Course',
                description: courseDetails.description || '',
                credit: courseDetails.credit || 0,
                semester: courseDetails.semester || 'N/A',
                course_major_code: courseDetails.course_major_code || 'N/A',
                course_code: courseDetails.course_code || 'N/A'
            };
        });
        res.status(200).send({ message: "lấy thành công", data: result });
    } catch (error) {
        console.error('❌ Error in fetchCourseRecommendations controller:', error);
        res.status(500).send({ message: 'Lỗi khi lấy đề xuất khóa học.' });
    }
};

// Fetch based on other person ality traits
export const fetchCourseRecommendationsv2 = async (req, res) => {
     const { student_id, semester_filter, k , major_code} = req.query;
    try {
        console.log('📥 Received recommendation v2 request for student_id:', student_id, 'semester filter:', semester_filter, 'major_code:', major_code);
        const studentRecommandations = await getStudentsByMajorAndSemester(major_code, semester_filter);
        if (!studentRecommandations || !studentRecommandations.id) {
            const listEnrollments = await getAllEnrollments();
            const countCourses = {};
            listEnrollments.forEach(enrollment => {
                const courseId = enrollment.course_id;
                if (countCourses[courseId]) {
                    countCourses[courseId] += 1;
                } else {
                    countCourses[courseId] = 1;
                }
            });
            const sortedCourses = Object.entries(countCourses)
                .sort((a, b) => b[1] - a[1])
                .slice(0, k || 10)
                .map(([course_id, count], index) => ({
                    course_id: course_id,
                    rank: index + 1
                }));
            const courseMap = getCourseMap();
            const result = sortedCourses.map(rec => {
                const courseDetails = courseMap[rec.course_id] || {};
                return {
                    course_id: rec.course_id,
                    rank: rec.rank,
                    course_name: courseDetails.course_name || 'Unknown Course',
                    description: courseDetails.description || '',
                    credit: courseDetails.credit || 0,
                    semester: courseDetails.semester || 'N/A',
                    course_major_code: courseDetails.course_major_code || 'N/A',
                    course_code: courseDetails.course_code || 'N/A'
                };
            });
            console.log('📊 Fallback popular courses recommendations:', result);
            return res.status(200).send({ message: "lấy thành công 10 môn học phổ biến", data: {} });
        }
        // If exist student we will use his id to get recommandation
        const recommandations = await getRecommendations(studentRecommandations.id, semester_filter || 0, k || 10);
        const courseMap = getCourseMap();
        const result = JSON.parse(recommandations).map(rec => {
            const courseDetails = courseMap[rec.course_id] || {};
            return {
                course_id: rec.course_id,
                rank: rec.rank,
                course_name: courseDetails.course_name || 'Unknown Course',
                description: courseDetails.description || '',
                credit: courseDetails.credit || 0,
                semester: courseDetails.semester || 'N/A',
                course_major_code: courseDetails.course_major_code || 'N/A',
                course_code: courseDetails.course_code || 'N/A'
            };
        });
        // console.log('📊 Raw recommendations v2 from model:', result);
        res.status(200).send({ message: "lấy thành công hồ sơ sinh viên tương tự", data: result });
    } catch (error) {   
        console.error('❌ Error in fetchCourseRecommendationsv2 controller:', error);   
        res.status(500).send({ message: 'Lỗi khi lấy đề xuất khóa học phiên bản 2.' });
    }

};

