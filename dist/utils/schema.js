"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserSchema = exports.updateDetailsSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    fullname: zod_1.z.string().min(3).max(30),
    username: zod_1.z.string().min(3).max(15),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.registerSchema = registerSchema;
const loginSchema = zod_1.z
    .object({
    username: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(1),
})
    .refine((data) => data.username || data.email, {
    message: "Username or Email required!",
    path: ["username", "email"],
});
exports.loginSchema = loginSchema;
const changePasswordSchema = zod_1.z
    .object({
    old_password: zod_1.z.string().min(1),
    new_password: zod_1.z.string().min(6),
    confirm_password: zod_1.z.string().min(6),
})
    .refine((data) => data.new_password === data.confirm_password, {
    message: "New and confirm password must match!",
    path: ["new_password", "confirm_password"],
});
exports.changePasswordSchema = changePasswordSchema;
const updateDetailsSchema = zod_1.z
    .object({
    fullname: zod_1.z.string().min(3).max(30).optional(),
    username: zod_1.z.string().min(3).max(15).optional(),
    email: zod_1.z.string().email().optional(),
})
    .refine((data) => data.fullname || data.username || data.email, {
    message: "Any one detail is required for update!",
    path: ["fullname", "username", "email"],
});
exports.updateDetailsSchema = updateDetailsSchema;
const deleteUserSchema = zod_1.z
    .object({
    current_password: zod_1.z.string(),
    confirm_password: zod_1.z.string(),
})
    .refine((data) => data.current_password === data.confirm_password, {
    message: "Current and confirm password must match!",
    path: ["current_password", "confirm_password"],
});
exports.deleteUserSchema = deleteUserSchema;
