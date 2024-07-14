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
exports.sessionUser = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const utils_1 = require("../utils");
const helper_1 = require("../helper");
const user_1 = __importDefault(require("../model/user"));
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullname, username, email, password } = yield req.body;
        const existedUser = yield user_1.default.findOne({
            $or: [{ username }, { email }],
        });
        if (existedUser) {
            let field;
            if (existedUser.username == username) {
                field = "Username";
            }
            else {
                field = "Email";
            }
            throw new utils_1.ApiError(409, `${field} already exists!`);
        }
        const hashed = yield (0, helper_1.generateHash)(password);
        const newUser = yield user_1.default.create({
            fullname,
            username,
            email,
            password: hashed,
        });
        if (newUser) {
            return (0, utils_1.ApiResponse)(req, res, 201, "Registered successfully!");
        }
        throw new utils_1.ApiError(500, "Error while registering!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = yield req.body;
        const user = yield user_1.default.findOne({
            $or: [{ username }, { email }],
        }).select("+password");
        if (!user) {
            throw new utils_1.ApiError(404, "User not registered!");
        }
        if (user && req.session.user) {
            if (String(user._id) === String(req.session.user)) {
                (0, helper_1.generateToken)(req, res, user._id);
                const data = {
                    sid: req.session.id,
                    uid: req.session.user,
                    jwt: req.session.token,
                };
                return (0, utils_1.ApiResponse)(req, res, 302, "Welcome, already logged in!", data);
            }
        }
        const checked = yield (0, helper_1.compareHash)(password, user.password);
        if (checked) {
            req.session.user = user._id;
            (0, helper_1.generateToken)(req, res, user._id);
            const data = {
                sid: req.session.id,
                uid: req.session.user,
                jwt: req.session.token,
            };
            return (0, utils_1.ApiResponse)(req, res, 200, "Logged in successfully!", data);
        }
        throw new utils_1.ApiError(403, "Invalid user credential!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.session.destroy(function (error) {
        if (error) {
            next(error);
        }
        else {
            res.clearCookie("jwt");
            res.clearCookie("session");
            return (0, utils_1.ApiResponse)(req, res, 200, "Logged out successfully!");
        }
    });
});
exports.logoutUser = logoutUser;
const sessionUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = {
            sid: req.session.id,
            uid: req.session.user,
            jwt: req.session.token,
            user: req.user,
        };
        return (0, utils_1.ApiResponse)(req, res, 200, "Current session user data!", data);
    }
    catch (error) {
        next(error);
    }
});
exports.sessionUser = sessionUser;
