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
exports.generateToken = exports.validateSchema = exports.compareHash = exports.generateHash = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const env_1 = __importDefault(require("../utils/env"));
/**
 * Generate hash of plain password.
 *
 * @async
 * @param {string} password Plain password.
 * @returns {Promise<string>} Hashed password.
 */
const generateHash = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield (0, bcryptjs_1.genSalt)(13);
    const hashed = yield (0, bcryptjs_1.hash)(password, salt);
    return hashed;
});
exports.generateHash = generateHash;
/**
 * Compare plain password and hashed password.
 *
 * @async
 * @param {string} password Plain password.
 * @param {string} hashed Hashed password.
 * @returns {Promise<boolean>} Return boolean result after comparing plain and hashed password.
 */
const compareHash = (password, hashed) => __awaiter(void 0, void 0, void 0, function* () {
    const checked = yield (0, bcryptjs_1.compare)(password, hashed);
    return checked;
});
exports.compareHash = compareHash;
/** Validate incoming req.body and pass to handler function. */
const validateSchema = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        const errors = (0, utils_1.ValidationError)(error);
        return (0, utils_1.ApiResponse)(req, res, 400, error.name, { errors });
    }
};
exports.validateSchema = validateSchema;
/**
 * Generate access and refresh token and set cookies.
 *
 * @param {Request} _req Request.
 * @param {Response} res Response.
 * @param {string} uid _id.
 * @returns {object} Return pair of access and refresh token.
 */
const generateToken = (req, res, uid) => {
    const token = jsonwebtoken_1.default.sign({ uid }, env_1.default.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: parseInt(env_1.default.TOKEN_EXPIRY),
    });
    res.cookie("jwt", token, {
        maxAge: parseInt(env_1.default.TOKEN_EXPIRY) * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: env_1.default.NODE_ENV !== "development",
    });
    req.session.token = token;
};
exports.generateToken = generateToken;
