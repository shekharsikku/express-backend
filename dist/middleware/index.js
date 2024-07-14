"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOrigin = exports.expressSession = void 0;
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("../utils/env"));
const MongoDBStore = (0, connect_mongodb_session_1.default)(express_session_1.default);
const store = new MongoDBStore({
    uri: env_1.default.DATABASE_URL,
    collection: "sessions",
});
store.on("error", (error) => console.log(error.message));
const expressSession = (0, express_session_1.default)({
    name: "session",
    secret: env_1.default.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    unset: "destroy",
    cookie: {
        maxAge: parseInt(env_1.default.SESSION_EXPIRY),
        httpOnly: true,
        sameSite: "none",
        secure: env_1.default.NODE_ENV !== "development",
    },
    rolling: true,
    store: store,
});
exports.expressSession = expressSession;
const corsOrigin = (0, cors_1.default)({
    origin: env_1.default.CORS_ORIGIN,
    credentials: true,
});
exports.corsOrigin = corsOrigin;
