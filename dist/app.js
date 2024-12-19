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
app.use("/api", routers_1.default);
app.all("*path", (_req, res) => {
    res.status(200).json({ message: "Hello, from Express via Vercel!" });
});
app.use(((err, _req, res, _next) => {
    console.error(`Error: ${err.message}`);
    res.status(500).json({ message: "Internal Server Error!" });
}));
exports.default = app;
