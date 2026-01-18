import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3001,
  DOMAIN: process.env.DOMAIN || 'localhost1',
};
