"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.mongodb = void 0;
const mongoose_1 = require("mongoose");
const ioredis_1 = require("ioredis");
const env_1 = __importDefault(require("../utils/env"));
const mongodb = async () => {
    try {
        const { connection } = await (0, mongoose_1.connect)(env_1.default.MONGODB_URI);
        return connection.readyState;
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
};
exports.mongodb = mongodb;
const createRedisClient = () => {
    const redis = new ioredis_1.Redis(env_1.default.REDIS_URI, {
        retryStrategy: () => null,
    });
    redis.on("connect", () => {
        console.log("Redis connection success!");
    });
    redis.on("error", (error) => {
        console.error("Redis connection error!", error.message);
    });
    return redis;
};
globalThis.redis = globalThis.redis ?? createRedisClient();
const redis = globalThis.redis;
exports.redis = redis;
