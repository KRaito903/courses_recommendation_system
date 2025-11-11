import grpc
from concurrent import futures
import time
import service_pb2
import service_pb2_grpc
import json
import sys
import os


from main import call_model_recommendation_system


class MLService(service_pb2_grpc.MLServiceServicer):
    def RecommendationService(self, request, context):
        student_id = request.student_id
        semester_filter = request.semester_filter
        k = request.k
        recommendations = call_model_recommendation_system(student_id, semester_filter, k)
        response = json.dumps(recommendations)
        return service_pb2.CoursesInfo(data=response)
    
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    service_pb2_grpc.add_MLServiceServicer_to_server(MLService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("gRPC server started on port 50051")
    try:
        while True:
            time.sleep(86400)  # Sleep for one day
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()