"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = exports.tokenMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const helper_1 = require("../helper");
const user_1 = __importDefault(require("../model/user"));
const env_1 = __importDefault(require("../utils/env"));
const tokenMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.jwt || req.session.token;
        if (!token) {
            throw new utils_1.ApiError(401, "Missing token!");
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.TOKEN_SECRET);
        const user = yield user_1.default.findById(decoded.uid);
        if (!decoded || !user) {
            throw new utils_1.ApiError(403, "Invalid token!");
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return (0, utils_1.ApiResponse)(req, res, 401, "Token expired!");
        }
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.tokenMiddleware = tokenMiddleware;
const sessionMiddleware = (req, res, next) => {
    if (req.session.user) {
        (0, helper_1.generateToken)(req, res, req.session.user);
        next();
    }
    else {
        return (0, utils_1.ApiResponse)(req, res, 401, "Unauthorized user!");
    }
};
exports.sessionMiddleware = sessionMiddleware;
