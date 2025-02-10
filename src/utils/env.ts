import dotenv from "dotenv";
import { cleanEnv, str, url, num, port } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  ACCESS_SECRET: str(),
  ACCESS_EXPIRY: num(),

  REFRESH_SECRET: str(),
  REFRESH_EXPIRY: num(),

  COOKIES_SECRET: str(),
  PAYLOAD_LIMIT: str(),
  PORT: port(),

  MONGODB_URI: url(),
  CORS_ORIGIN: url(),
  NODE_ENV: str({ choices: ["development", "production"] }),
});

export default env;
