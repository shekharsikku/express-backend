"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const mongoose_1 = require("mongoose");
/**
 * UserSchema for define UserModel.
 *
 * @types {UserInterface}
 *
 * @property {string} fullname - The user's fullname.
 * @property {string} username - The user's username.
 * @property {string} email - The user's email.
 * @property {string} password - The user's password.
 * @property {string} refreshtoken - The user's refreshtoken.
 */
const UserSchema = new mongoose_1.Schema({
    fullname: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    refreshtoken: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
exports.UserSchema = UserSchema;
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
