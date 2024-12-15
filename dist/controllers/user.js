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
exports.userInformation = exports.changePassword = exports.profileSetup = void 0;
const utils_1 = require("../utils");
const helpers_1 = require("../helpers");
const user_1 = __importDefault(require("../models/user"));
const profileSetup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const details = yield req.body;
        const username = (0, helpers_1.removeSpaces)(details === null || details === void 0 ? void 0 : details.username);
        const requestUser = req.user;
        if (username !== (requestUser === null || requestUser === void 0 ? void 0 : requestUser.username)) {
            const existsUsername = yield user_1.default.findOne({ username });
            if (existsUsername) {
                throw new utils_1.ApiError(409, "Username already exists!");
            }
        }
        const updateDetails = {
            name: details.name,
            username,
            gender: details.gender,
            bio: details.bio,
        };
        const isEmpty = (0, helpers_1.hasEmptyField)({
            name: details.name,
            username,
            gender: details.gender,
        });
        if (!isEmpty) {
            updateDetails.setup = true;
        }
        const updatedProfile = yield user_1.default.findByIdAndUpdate(requestUser === null || requestUser === void 0 ? void 0 : requestUser._id, Object.assign({}, updateDetails), { new: true }).select("-friends");
        if (!updatedProfile) {
            throw new utils_1.ApiError(400, "Profile setup not completed!");
        }
        else if (!updatedProfile.setup) {
            const userData = (0, helpers_1.maskedDetails)(updatedProfile);
            return (0, utils_1.ApiResponse)(res, 200, "Please, complete your profile!", userData);
        }
        const accessData = (0, helpers_1.createAccessData)(updatedProfile);
        const accessToken = (0, helpers_1.generateAccess)(res, accessData);
        return (0, utils_1.ApiResponse)(res, 200, "Profile updated successfully!", accessData);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.profileSetup = profileSetup;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { old_password, new_password } = yield req.body;
        const requestUser = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select("+password -friends");
        if (!requestUser) {
            throw new utils_1.ApiError(403, "Invalid authorization!");
        }
        if (old_password === new_password) {
            throw new utils_1.ApiError(400, "Please, choose a different password!");
        }
        const validatePassword = yield (0, helpers_1.compareHash)(old_password, requestUser.password);
        if (!validatePassword) {
            throw new utils_1.ApiError(403, "Incorrect old password!");
        }
        const hashedPassword = yield (0, helpers_1.generateHash)(new_password);
        requestUser.password = hashedPassword;
        yield requestUser.save({ validateBeforeSave: true });
        const accessData = (0, helpers_1.createAccessData)(requestUser);
        const accessToken = (0, helpers_1.generateAccess)(res, accessData);
        return (0, utils_1.ApiResponse)(res, 200, "Password changed successfully!", accessData);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.changePassword = changePassword;
const userInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestUser = req.user;
        if (requestUser === null || requestUser === void 0 ? void 0 : requestUser.setup) {
            return (0, utils_1.ApiResponse)(res, 200, "User profile information!", requestUser);
        }
        const userData = (0, helpers_1.maskedDetails)(requestUser);
        return (0, utils_1.ApiResponse)(res, 200, "Please, complete your profile!", userData);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.userInformation = userInformation;
