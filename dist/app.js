"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("./utils/env"));
const routers_1 = __importDefault(require("./routers"));
const database_1 = require("./database");
const app = (0, express_1.default)();
app.use(express_1.default.json({
    limit: env_1.default.PAYLOAD_LIMIT,
    strict: true,
}));
app.use(express_1.default.urlencoded({
    limit: env_1.default.PAYLOAD_LIMIT,
    extended: true,
}));
app.use((0, cors_1.default)({
    origin: env_1.default.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)(env_1.default.COOKIES_SECRET));
app.use("/public/temp", express_1.default.static(path_1.default.join(__dirname, "../public/temp")));
if (env_1.default.isDev) {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.use((0, morgan_1.default)("tiny"));
}
app.use(async (_req, _res, next) => {
    if (!database_1.redis || database_1.redis.status !== "ready") {
        console.warn("Redis is disconnected! Attempting to reconnect...");
        try {
            await database_1.redis?.connect();
            console.log("Redis reconnected successfully!");
        }
        catch (error) {
            console.error("Redis reconnection failed!", error.message);
        }
    }
    next();
});
app.use("/api", routers_1.default);
app.get("*path", (_req, res) => {
    if (env_1.default.isDev) {
        res.status(200).json({ message: "Welcome to Express Backend!" });
    }
    else {
        res.status(301).redirect(env_1.default.REDIRECT_URL);
    }
});
const utils_1 = require("./utils");
app.use(((err, _req, res, _next) => {
    console.error(`Error: ${err.message}`);
    let error = new utils_1.ApiError(500, "Internal Server Error!");
    if (err.name === "CastError") {
        error = new utils_1.ApiError(404, "Resource Not Found!");
    }
    if (err.code === 11000) {
        error = new utils_1.ApiError(400, "Duplicate Field Value Entered!");
    }
    if (err.name === "ValidationError" && err.errors) {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new utils_1.ApiError(400, message.join(", "));
    }
    return (0, utils_1.ApiResponse)(res, error.code, error.message);
}));
exports.default = app;
