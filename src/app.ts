import express from 'express';
import cookieParser from 'cookie-parser';
import authRoute from './routes/authRoute.js';
import termRoute from './routes/termRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/terms', termRoute);

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err ? Number((err as { statusCode: unknown }).statusCode) : 500;

  if (!Number.isFinite(statusCode) || statusCode < 400 || statusCode > 599) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    return;
  }

  const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : '서버 오류가 발생했습니다.';
  res.status(statusCode).json({ message });
  void req;
  void next;
});

export default app;
