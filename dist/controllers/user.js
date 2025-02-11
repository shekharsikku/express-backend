"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchContacts = exports.searchUsers = exports.userInformation = exports.changePassword = exports.profileSetup = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../utils");
const redis_1 = require("../utils/redis");
const helpers_1 = require("../helpers");
const conversation_1 = __importDefault(require("../models/conversation"));
const user_1 = __importDefault(require("../models/user"));
const profileSetup = async (req, res) => {
    try {
        const { name, username, gender, bio } = await req.body;
        const requestUser = req.user;
        if (username !== requestUser?.username) {
            const existsUsername = await user_1.default.exists({ username });
            if (existsUsername) {
                throw new utils_1.ApiError(409, "Username already exists!");
            }
        }
        const userDetails = { name, username, gender, bio, setup: false };
        const isCompleted = !(0, helpers_1.hasEmptyField)({ name, username, gender });
        if (isCompleted) {
            userDetails.setup = true;
        }
        const updatedProfile = await user_1.default.findByIdAndUpdate(requestUser?._id, userDetails, { new: true });
        if (!updatedProfile) {
            throw new utils_1.ApiError(400, "Profile setup not completed!");
        }
        const userInfo = (0, helpers_1.createUserInfo)(updatedProfile);
        if (!userInfo.setup) {
            return (0, utils_1.ApiResponse)(res, 200, "Please, complete your profile!", userInfo);
        }
        (0, helpers_1.generateAccess)(res, userInfo._id);
        await (0, redis_1.setData)(userInfo);
        return (0, utils_1.ApiResponse)(res, 200, "Profile updated successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.profileSetup = profileSetup;
const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = await req.body;
        if (old_password === new_password) {
            throw new utils_1.ApiError(400, "Please, choose a different password!");
        }
        const requestUser = await user_1.default.findById(req.user?._id).select("+password");
        if (!requestUser) {
            throw new utils_1.ApiError(403, "Invalid authorization!");
        }
        const isCorrect = await (0, bcryptjs_1.compare)(old_password, requestUser.password);
        if (!isCorrect) {
            throw new utils_1.ApiError(403, "Incorrect old password!");
        }
        const hashSalt = await (0, bcryptjs_1.genSalt)(12);
        requestUser.password = await (0, bcryptjs_1.hash)(new_password, hashSalt);
        await requestUser.save({ validateBeforeSave: true });
        const userInfo = (0, helpers_1.createUserInfo)(requestUser);
        (0, helpers_1.generateAccess)(res, userInfo._id);
        await (0, redis_1.setData)(userInfo);
        return (0, utils_1.ApiResponse)(res, 200, "Password changed successfully!", userInfo);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.changePassword = changePassword;
const userInformation = async (req, res) => {
    try {
        const requestUser = req.user;
        const responseMessage = requestUser?.setup
            ? "User profile information!"
            : "Please, complete your profile!";
        return (0, utils_1.ApiResponse)(res, 200, responseMessage, requestUser);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.userInformation = userInformation;
const searchUsers = async (req, res) => {
    try {
        const search = req.query.search;
        if (!search) {
            throw new utils_1.ApiError(400, "Search query is required!");
        }
        const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(terms, "i");
        const result = await user_1.default.find({
            $and: [
                { _id: { $ne: req.user?._id } },
                { setup: true },
                { $or: [{ name: regex }, { username: regex }, { email: regex }] },
            ],
        }).lean();
        if (result.length == 0) {
            throw new utils_1.ApiError(404, "No any user found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Available contacts!", result);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.searchUsers = searchUsers;
const fetchContacts = async (req, res) => {
    try {
        const uid = new mongoose_1.Types.ObjectId(req.user?._id);
        const conversations = await conversation_1.default.find({
            participants: uid,
        })
            .sort({ interaction: -1 })
            .populate("participants", "name email username gender image bio")
            .lean();
        const contacts = conversations
            .map((conversation) => {
            const contact = conversation.participants.find((participant) => !participant._id.equals(uid));
            return contact
                ? { ...contact, interaction: conversation.interaction }
                : null;
        })
            .filter(Boolean);
        return (0, utils_1.ApiResponse)(res, 200, "Contacts fetched successfully!", contacts);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "An error occurred while fetching contacts!");
    }
};
exports.fetchContacts = fetchContacts;
