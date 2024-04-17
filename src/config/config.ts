import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGODB_URL,
  env: process.env.NODE_ENV,
  jwtsecret: process.env.JWT_SECRET,
  frontend_domain: process.env.FRONTEND_DOMAI,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET_KEY,
};

export const config = Object.freeze(_config);
