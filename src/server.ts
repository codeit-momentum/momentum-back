import http from 'http';
import app from './app.js';
import { CONFIG } from '../config/config.js';

const server = http.createServer(app);

// 서버 실행
server.listen(CONFIG.PORT, () => {
  console.log(`Server running on http://${CONFIG.DOMAIN}:${CONFIG.PORT}`);
});
