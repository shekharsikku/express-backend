import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodSchema } from "zod";
import { ApiResponse } from ".";

const ValidationError = (
  error: ZodError
): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

export const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(res, 400, "Validation error!", null, errors);
    }
  };

export const sendEmailSchema = z.object({
  subject: z.string().min(3),
  text: z.string().min(5),
  category: z.string().min(3),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const verifySchema = z.object({
  code: z.string(),
  email: z.string().email(),
});

export const forgetSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  code: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string(),
    device_info: z.string().optional(),
  })
  .refine((data) => data.username || data.email, {
    message: "Username or Email required!",
    path: ["username", "email"],
  });

export const profileSchema = z.object({
  name: z.string().min(3).max(30),
  username: z.string().min(3).max(15),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string(),
});

export const passwordSchema = z.object({
  old_password: z.string(),
  new_password: z.string().min(6),
});
