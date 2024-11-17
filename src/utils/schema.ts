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

/*
const changePasswordSchema = z
  .object({
    old_password: z.string().min(1),
    new_password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "New and confirm password must match!",
    path: ["new_password", "confirm_password"],
  });

const updateDetailsSchema = z
  .object({
    fullname: z.string().min(3).max(30).optional(),
    username: z.string().min(3).max(15).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.fullname || data.username || data.email, {
    message: "Any one detail is required for update!",
    path: ["fullname", "username", "email"],
  });

const deleteUserSchema = z
  .object({
    current_password: z.string(),
    confirm_password: z.string(),
  })
  .refine((data) => data.current_password === data.confirm_password, {
    message: "Current and confirm password must match!",
    path: ["current_password", "confirm_password"],
  });

export {
  loginSchema,
  changePasswordSchema,
  updateDetailsSchema,
  deleteUserSchema,
};
*/
