import service_pb2_grpc
import grpc
import service_pb2
from concurrent import futures
import json

def AddfunctionA(a, b):
    result = a + b
    res_json = {"result": result, "message": "Addition successful", "status": "OK"}   
    return json.dumps(res_json)


class IML(service_pb2_grpc.TestServiceServicer):
    def Addfunction(self, request, context):
        a = request.a
        b = request.b
        res_str = AddfunctionA(a, b)
        return service_pb2.Result(res=res_str)
    
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    service_pb2_grpc.add_TestServiceServicer_to_server(IML(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Server started on port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()