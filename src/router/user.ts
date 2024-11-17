import { Router } from "express";
import {
  validateSchema,
  registerSchema,
  verifySchema,
  forgetSchema,
  resetSchema,
  loginSchema,
} from "../utils/schema";
import {
  registerUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  loginUser,
  logoutUser,
  userInformation,
} from "../controller/user";
import { authAccess } from "../middleware";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerUser);
router.post("/verify-email", validateSchema(verifySchema), verifyEmail);
router.post("/forget-password", validateSchema(forgetSchema), forgetPassword);
router.post("/reset-password", validateSchema(resetSchema), resetPassword);
router.post("/login", validateSchema(loginSchema), loginUser);

router.delete("/logout", authAccess, logoutUser);

// router.delete(
//   "/delete-user",
//   validateSchema(deleteUserSchema),
//   accessToken,
//   deleteUserDetails
// );

// router.patch("/refresh-token", refreshToken, tokenRefresh);
// router.patch(
//   "/change-password",
//   validateSchema(changePasswordSchema),
//   accessToken,
//   changeCurrentPassword
// );
// router.patch(
//   "/update-details",
//   validateSchema(updateDetailsSchema),
//   accessToken,
//   updateUserDetails
// );

router.get("/user-information", authAccess, userInformation);

export default router;
