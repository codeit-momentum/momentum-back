import express from 'express';
import cookieParser from 'cookie-parser';
import testRoute from './routes/testRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api', testRoute);

export default app;
