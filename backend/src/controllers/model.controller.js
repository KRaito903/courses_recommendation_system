import { getRecommendations } from '../services/model.service.js';
import { getCourseMap } from '../config/localCache.js';
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
        console.log('📊 Raw recommendations from model:', result);
        res.status(200).send({ message: "lấy thành công" });
    } catch (error) {
        console.error('❌ Error in fetchCourseRecommendations controller:', error);
        res.status(500).send({ message: 'Lỗi khi lấy đề xuất khóa học.' });
    }
};