import dotenv from "dotenv";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  DATABASE_URL: str(),

  ACCESS_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str(),
  ACCESS_COOKIE_EXPIRY: str(),
  
  REFRESH_TOKEN_SECRET: str(),
  REFRESH_TOKEN_EXPIRY: str(),
  REFRESH_COOKIE_EXPIRY: str(),

  COOKIES_SECRET: str(),

  CORS_ORIGIN: str(),
  PORT: port(),
  NODE_ENV: str(),
});

export default env;
