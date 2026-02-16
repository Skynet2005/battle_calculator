import "dotenv/config";
import { config as envConfig } from '../config/env';

export const config = {
  DB_URL: envConfig.DB_URL,
};
