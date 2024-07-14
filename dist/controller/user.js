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
exports.tokenRefresh = exports.sessionUser = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
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
        const checked = yield (0, helper_1.compareHash)(password, user.password);
        if (checked) {
            const uid = String(user._id);
            const { access, refresh } = (0, helper_1.generateToken)(req, res, uid);
            user.refreshtoken = refresh;
            yield user.save({ validateBeforeSave: false });
            return (0, utils_1.ApiResponse)(req, res, 200, "Logged in successfully!", {
                id: user._id,
                token: { access, refresh },
            });
        }
        throw new utils_1.ApiError(403, "Invalid user credential!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    yield user_1.default.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshtoken: 1, // this removes the field from document
        },
    }, {
        new: true,
    });
    res.clearCookie("access");
    res.clearCookie("refresh");
    return (0, utils_1.ApiResponse)(req, res, 200, "Logged out successfully!");
});
exports.logoutUser = logoutUser;
const sessionUser = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.user;
        return (0, utils_1.ApiResponse)(req, res, 200, "Current session user data!", data);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.sessionUser = sessionUser;
const tokenRefresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const token = req.token;
        return (0, utils_1.ApiResponse)(req, res, 200, "Token refreshed successfully!", {
            id: user === null || user === void 0 ? void 0 : user._id,
            token,
        });
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(req, res, error.code, error.message);
    }
});
exports.tokenRefresh = tokenRefresh;
