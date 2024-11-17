import { Router } from "express";
import {
  validateSchema,
  registerSchema,
  verifySchema,
  forgetSchema,
  resetSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
} from "../utils/schema";
import {
  registerUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  loginUser,
  logoutUser,
  userInformation,
  refreshAuth,
  profileSetup,
  changePassword,
} from "../controller/user";
import { authAccess, authRefresh } from "../middleware";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerUser);
router.post("/verify-email", validateSchema(verifySchema), verifyEmail);
router.post("/forget-password", validateSchema(forgetSchema), forgetPassword);
router.post("/reset-password", validateSchema(resetSchema), resetPassword);
router.post("/login", validateSchema(loginSchema), loginUser);

router.delete("/logout", authAccess, logoutUser);

router.patch(
  "/change-password",
  authAccess,
  validateSchema(passwordSchema),
  changePassword
);
router.patch(
  "/profile-setup",
  authAccess,
  validateSchema(profileSchema),
  profileSetup
);

router.get("/user-information", authAccess, userInformation);
router.get("/auth-refresh", authRefresh, refreshAuth);

export default router;
