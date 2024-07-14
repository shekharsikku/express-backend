import { Router } from "express";
import { validateSchema } from "../helper";
import { loginSchema, registerSchema } from "../utils/schema";
import { accessToken, refreshToken } from "../middleware";
import {
  loginUser,
  logoutUser,
  registerUser,
  sessionUser,
  tokenRefresh,
} from "../controller/user";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);

router.delete("/logout", accessToken, logoutUser);

router.patch("/refresh", refreshToken, tokenRefresh);

router.get(["/session", "/current"], accessToken, sessionUser);

export default router;
