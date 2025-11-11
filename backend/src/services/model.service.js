import  grpcClient from '../grpc/client.js';

const getRecommendations = async (student_id, semesterFilter, k = 10) => {
    return new Promise((resolve, reject) => {
        const request = {
            student_id: student_id,
            semester_filter: semesterFilter,
            k: k
        };

        grpcClient.RecommendationService(request, (error, response) => {
            if (error) {
                console.error('❌ Error fetching recommendations from gRPC service:', error);
                return reject(new Error('Error fetching recommendations'));
            }
            console.log('✅ Recommendations received from gRPC service', response);
            resolve(response.data);
        });
    });
}

export { getRecommendations };