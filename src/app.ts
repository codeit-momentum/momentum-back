import cookieParser from 'cookie-parser';
import express from 'express';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import bucketRoute from './routes/bucketRoute.js';
import testRoute from './routes/testRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api', testRoute);
app.use('/api/v1/buckets', bucketRoute);

app.use(errorMiddleware);

export default app;
