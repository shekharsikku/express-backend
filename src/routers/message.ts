import { Router } from "express";
import { authAccess } from "../middlewares";
import { validateSchema, messageSchema } from "../utils/schema";
import {
  deleteMessages,
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "../controllers/message";

const router = Router();

router.get("/get/:id", authAccess, getMessages);

router.post(
  "/send/:id",
  authAccess,
  validateSchema(messageSchema),
  sendMessage
);

router.patch("/edit/:id", authAccess, editMessage);

router.delete("/delete/:id", authAccess, deleteMessage);
router.delete("/delete-messages", authAccess, deleteMessages);

export default router;
