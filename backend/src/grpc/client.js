// Init client gRCP 
import grcp from '@grpc/grpc-js';
import loader from '@grpc/proto-loader';

const PROTO_PATH = '/Users/quockhoile/Desktop/DaiHoc/MLwithGraph/Project/GNN-Model/service.proto';
const packageDefinition = loader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const protoDescriptor = grcp.loadPackageDefinition(packageDefinition).MLService;
const grpcClient = new protoDescriptor('localhost:50051', grcp.credentials.createInsecure());

export default grpcClient;