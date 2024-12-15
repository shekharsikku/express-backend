"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordSchema = exports.profileSchema = exports.signInSchema = exports.signUpSchema = exports.validateSchema = void 0;
const zod_1 = require("zod");
const _1 = require(".");
const ValidationError = (error) => {
    return error.errors.map((err) => ({
        path: err.path.join(", "),
        message: err.message,
    }));
};
const validateSchema = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        const errors = ValidationError(error);
        return (0, _1.ApiResponse)(res, 400, "Validation error!", null, errors);
    }
};
exports.validateSchema = validateSchema;
const signUpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.signUpSchema = signUpSchema;
const signInSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().optional(),
    password: zod_1.z.string(),
})
    .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
});
exports.signInSchema = signInSchema;
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(30),
    username: zod_1.z.string().min(3).max(15),
    gender: zod_1.z.enum(["Male", "Female", "Other"]),
    bio: zod_1.z.string(),
});
exports.profileSchema = profileSchema;
const passwordSchema = zod_1.z.object({
    old_password: zod_1.z.string(),
    new_password: zod_1.z.string().min(6),
});
exports.passwordSchema = passwordSchema;
