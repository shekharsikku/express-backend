import { Router } from "express";
import AuthRouter from "./auth";
import UserRouter from "./user";
import FriendRouter from "./friend";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/friend", FriendRouter);

export default router;
