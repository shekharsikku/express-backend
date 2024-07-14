"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./utils/env"));
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json({
    limit: "100kb",
    strict: true,
}));
app.use(express_1.default.urlencoded({
    limit: "100kb",
    extended: true,
}));
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
app.use(middleware_1.corsOrigin);
app.use(middleware_1.expressSession);
app.use((0, cookie_parser_1.default)(env_1.default.COOKIES_SECRET));
env_1.default.NODE_ENV === "development" ? app.use((0, morgan_1.default)("dev")) : null;
app.use((err, _req, res, next) => {
    try {
        console.error(`Error: ${err.message}`);
        return res.status(500).json({ message: "Internal server error!" });
    }
    catch (error) {
        next(error);
    }
});
app.get("/", (_req, res) => {
    return res.status(200).send({ message: "Hello, from Vercel!" });
});
const user_1 = __importDefault(require("./router/user"));
app.use("/api/user", user_1.default);
exports.default = app;
