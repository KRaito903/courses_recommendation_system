import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mainRouter from './routes/router.js';
import { setUpRole } from './utils/setupRole.js';
import grpcClient from './grpc/client.js';
import { mapCourseIdstoCourse } from './utils/mappingCourses.js';
import { setCourseMap }  from './config/localCache.js';
const app = express();

dotenv.config();

// Get setup Local Cache
// mapCourseIdstoCourse().then((courseMap) => {
//     console.log('Course ID to Name mapping completed.', courseMap);
//     setCourseMap(courseMap);
// }).catch((error) => {
//     console.error('Failed to map course IDs to course names:', error);
// });

const courseMap = await mapCourseIdstoCourse();
setCourseMap(courseMap);

// Set up admin role on server start
// setUpRole(process.env.ADMIN_UID, 'admin').catch((error) => {
//     console.error('Failed to set up admin role:', error);
// });


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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


export default app;