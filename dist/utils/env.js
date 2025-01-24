"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const envalid_1 = require("envalid");
dotenv_1.default.config();
const env = (0, envalid_1.cleanEnv)(process.env, {
    MAILTRAP_TOKEN: (0, envalid_1.str)(),
    MAILTRAP_ENDPOINT: (0, envalid_1.url)(),
    MAILTRAP_EMAIL: (0, envalid_1.email)(),
    IPIFY_ADDRESS_URL: (0, envalid_1.url)(),
    IMAGEKIT_PUBLIC_KEY: (0, envalid_1.str)(),
    IMAGEKIT_PRIVATE_KEY: (0, envalid_1.str)(),
    IMAGEKIT_URL_ENDPOINT: (0, envalid_1.url)(),
    ACCESS_SECRET: (0, envalid_1.str)(),
    ACCESS_EXPIRY: (0, envalid_1.num)(),
    REFRESH_SECRET: (0, envalid_1.str)(),
    REFRESH_EXPIRY: (0, envalid_1.num)(),
    COOKIES_SECRET: (0, envalid_1.str)(),
    PAYLOAD_LIMIT: (0, envalid_1.str)(),
    PORT: (0, envalid_1.port)(),
    MONGODB_URI: (0, envalid_1.url)(),
    CORS_ORIGIN: (0, envalid_1.url)(),
    NODE_ENV: (0, envalid_1.str)({ choices: ["development", "production"] }),
});
exports.default = env;
