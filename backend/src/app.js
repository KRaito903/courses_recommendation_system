import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mainRouter from './routes/router.js';
import { setUpRole } from './utils/setupRole.js';

// Init client gRCP 
import grcp from '@grpc/grpc-js';
import loader from '@grpc/proto-loader';

const PROTO_PATH = '/Users/quockhoile/Desktop/DaiHoc/MLwithGraph/Project/GNN-Model/modern-model/service.proto';
const packageDefinition = loader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const protoDescriptor = grcp.loadPackageDefinition(packageDefinition).TestService;
const grpcClient = new protoDescriptor('localhost:50051', grcp.credentials.createInsecure());
  

const app = express();

dotenv.config();

setUpRole(process.env.ADMIN_UID, 'admin').catch((error) => {
    console.error('Failed to set up admin role:', error);
});


// Middleware
app.use(cors(
  {
    origin: 'http://localhost:5173',
    credentials: true
  }
));

app.use(express.json());

// Routes
app.use('/api', mainRouter);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Test gRPC endpoint
app.get('/grpc-test', (req, res) => {
    const reqData = {
        a: req.query.a || 1,
        b: req.query.b || 3
    }
    grpcClient.Addfunction(reqData, (error, response) => {
        if (error) {
            console.error('gRPC Error:', error);
            return res.status(500).send({ message: 'gRPC request failed.' });
        }
        console.log('gRPC Response:', response.res);
        res.send({ message: 'gRPC request successful!', data: JSON.parse(response.res) });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;