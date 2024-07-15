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
exports.refreshToken = exports.accessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const helper_1 = require("../helper");
const user_1 = __importDefault(require("../model/user"));
const env_1 = __importDefault(require("../utils/env"));
/**
 * Middleware function for access resource using access token.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {NextFunction} Pass handler to next controller function if access token validate successfully.
 */
const accessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.access;
        if (!token) {
            throw new utils_1.ApiError(401, "Unauthorized access request!");
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.ACCESS_TOKEN_SECRET);
        const user = yield user_1.default.findById(decoded.uid);
        if (!decoded || !user) {
            throw new utils_1.ApiError(403, "Invalid access request!");
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return (0, utils_1.ApiResponse)(req, res, 401, "Access request expired!");
        }
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.accessToken = accessToken;
/**
 * Middleware function for refresh expired access token.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {NextFunction} Pass handler to next controller function if expired access token refreshed successfully.
 */
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.refresh;
        if (!token) {
            throw new utils_1.ApiError(401, "Unauthorized user request!");
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.REFRESH_TOKEN_SECRET);
        const user = yield user_1.default.findById(decoded === null || decoded === void 0 ? void 0 : decoded.uid).select("+refreshtoken");
        if (!decoded || !user || token !== (user === null || user === void 0 ? void 0 : user.refreshtoken)) {
            throw new utils_1.ApiError(401, "Invalid user request!");
        }
        const { access, refresh } = (0, helper_1.generateToken)(req, res, user._id);
        user.refreshtoken = refresh;
        yield user.save({ validateBeforeSave: false });
        const tokens = { access, refresh };
        req.token = tokens;
        next();
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.refreshToken = refreshToken;
