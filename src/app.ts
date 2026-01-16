import express from 'express';
import http from 'http';
import { CONFIG } from '../config/index.js';

const app = express();

app.use(express.json());

const server = http.createServer(app);

server.listen(CONFIG.PORT, () => {
  console.log(`Server running on http://${CONFIG.DOMAIN}:${CONFIG.PORT}`);
});

export default app;
