import { Router } from "express";
import { validateSchema } from "../helper";
import { loginSchema, registerSchema } from "../utils/schema";
import { sessionMiddleware, tokenMiddleware } from "../middleware/auth";
import {
  loginUser,
  logoutUser,
  registerUser,
  sessionUser,
} from "../controller/user";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);

router.delete("/logout", sessionMiddleware, logoutUser);

router.get(
  ["/session", "/current"],
  sessionMiddleware,
  tokenMiddleware,
  sessionUser
);

export default router;
