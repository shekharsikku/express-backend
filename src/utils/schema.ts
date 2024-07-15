import { z } from "zod";

const registerSchema = z.object({
  fullname: z.string().min(3).max(30),
  username: z.string().min(3).max(15),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.username || data.email, {
    message: "Username or Email required!",
    path: ["username", "email"],
  });

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
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateDetailsSchema,
  deleteUserSchema,
};
