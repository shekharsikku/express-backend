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

export { registerSchema, loginSchema };
