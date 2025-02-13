import { Router } from "express";
import { authAccess } from "../middlewares";
import { validateSchema, profileSchema, passwordSchema } from "../utils/schema";
import {
  profileSetup,
  changePassword,
  userInformation,
  searchUsers,
  fetchContacts,
} from "../controllers/user";

const router = Router();

router.patch(
  "/profile-setup",
  authAccess,
  validateSchema(profileSchema),
  profileSetup
);

router.patch(
  "/change-password",
  authAccess,
  validateSchema(passwordSchema),
  changePassword
);

router.get("/user-information", authAccess, userInformation);
router.get("/search-users", authAccess, searchUsers);
router.get("/fetch-contacts", authAccess, fetchContacts);

export default router;
