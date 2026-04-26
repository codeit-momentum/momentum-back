import cookieParser from 'cookie-parser';
import express from 'express';
import authRoute from './routes/authRoute.js';
import bucketRoute from './routes/bucketRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/buckets', bucketRoute);

export default app;
