import http from 'http';
import app from './app.js';
import { CONFIG } from '../config/index.js';

const server = http.createServer(app);

server.listen(CONFIG.PORT, () => {
  console.log(`Server running on http://${CONFIG.DOMAIN}:${CONFIG.PORT}`);
});
