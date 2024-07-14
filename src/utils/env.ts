import dotenv from "dotenv";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  DATABASE_URL: str(),

  TOKEN_SECRET: str(),
  TOKEN_EXPIRY: str(),

  SESSION_EXPIRY: str(),
  SESSION_SECRET: str(),

  COOKIES_SECRET: str(),

  CORS_ORIGIN: str(),
  PORT: port(),
  NODE_ENV: str(),
});

export default env;
