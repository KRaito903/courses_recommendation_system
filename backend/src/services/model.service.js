import  grpcClient from '../grpc/client.js';

const getRecommendations = async (student_id, semesterFilter, k = 10) => {
    return new Promise((resolve, reject) => {
        const request = {
            student_id: student_id,
            semester_filter: semesterFilter,
            k: k
        };
        console.log('📥 Sending recommendation request to gRPC service:', request);
        grpcClient.RecommendationService(request, (error, response) => {
            if (error) {
                console.error('❌ Error fetching recommendations from gRPC service:', error.code);
                if (error.code == 2) {
                    resolve(JSON.stringify([])); // Return empty list if no recommendations
                    return;
                }
                return reject(new Error('Error fetching recommendations'));
            }
            console.log('✅ Recommendations received from gRPC service');
            resolve(response.data);
        });
    });
}

export { getRecommendations };