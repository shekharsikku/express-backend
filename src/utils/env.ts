import dotenv from "dotenv";
import { cleanEnv, email, port, url, str, num } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  MAILTRAP_TOKEN: str(),
  MAILTRAP_ENDPOINT: url(),
  MAILTRAP_EMAIL: email(),
  IPIFY_ADDRESS_URL: url(),

  IMAGEKIT_PUBLIC_KEY: str(),
  IMAGEKIT_PRIVATE_KEY: str(),
  IMAGEKIT_URL_ENDPOINT: url(),

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
