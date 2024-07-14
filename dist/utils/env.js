"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const envalid_1 = require("envalid");
dotenv_1.default.config();
const env = (0, envalid_1.cleanEnv)(process.env, {
    DATABASE_URL: (0, envalid_1.str)(),
    TOKEN_SECRET: (0, envalid_1.str)(),
    TOKEN_EXPIRY: (0, envalid_1.str)(),
    SESSION_EXPIRY: (0, envalid_1.str)(),
    SESSION_SECRET: (0, envalid_1.str)(),
    COOKIES_SECRET: (0, envalid_1.str)(),
    CORS_ORIGIN: (0, envalid_1.str)(),
    PORT: (0, envalid_1.port)(),
    NODE_ENV: (0, envalid_1.str)(),
});
exports.default = env;
