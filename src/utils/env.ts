import dotenv from "dotenv";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  MAILTRAP_TOKEN: str(),
  MAILTRAP_ENDPOINT: str(),
  MAILTRAP_EMAIL: str(),

  ACCESS_SECRET: str(),
  ACCESS_EXPIRY: str(),

  REFRESH_SECRET: str(),
  REFRESH_EXPIRY: str(),

  COOKIES_SECRET: str(),
  PAYLOAD_LIMIT: str(),
  PORT: port(),

  MONGODB_URI: str(),
  CORS_ORIGIN: str(),
  NODE_ENV: str(),
});

export default env;
