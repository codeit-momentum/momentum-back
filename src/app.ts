import cookieParser from 'cookie-parser';
import express from 'express';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import authRoute from './routes/authRoute.js';
import bucketRoute from './routes/bucketRoute.js';
import momentRoute from './routes/momentRoute.js';
import termRoute from './routes/termRoute.js';
import userRoute from './routes/userRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/buckets', bucketRoute);
app.use('/api/v1/terms', termRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/moments', momentRoute);

app.use(errorMiddleware);

export default app;
