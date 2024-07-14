"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
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
