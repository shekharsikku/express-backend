import { Router } from "express";
import { validateSchema } from "../helper";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateDetailsSchema,
  deleteUserSchema,
} from "../utils/schema";
import { accessToken, refreshToken } from "../middleware";
import {
  loginUser,
  logoutUser,
  registerUser,
  currentUser,
  tokenRefresh,
  changeCurrentPassword,
  updateUserDetails,
  deleteUserDetails
} from "../controller/user";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);

router.delete("/logout", accessToken, logoutUser);
router.delete(
  "/delete-user",
  validateSchema(deleteUserSchema),
  accessToken,
  deleteUserDetails
);

router.patch("/refresh-token", refreshToken, tokenRefresh);
router.patch(
  "/change-password",
  validateSchema(changePasswordSchema),
  accessToken,
  changeCurrentPassword
);
router.patch(
  "/update-details",
  validateSchema(updateDetailsSchema),
  accessToken,
  updateUserDetails
);

router.get("/current-user", accessToken, currentUser);

export default router;
