import { Router, Request, Response } from "express";
import { ApiResponse } from "../utils";
import AuthRouter from "./auth";
import UserRouter from "./user";
import FriendRouter from "./friend";
import User from "../models/user";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/friend", FriendRouter);

/** For delete expired auth tokens */
router.delete("/delete-tokens", async (_req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    const deleteResult = await User.updateMany(
      { "authentication.expiry": { $lt: currentDate } },
      {
        $pull: {
          authentication: { expiry: { $lt: currentDate } },
        },
      }
    );
    return ApiResponse(res, 301, "Expired tokens deleted!", {
      date: currentDate,
      result: deleteResult,
    });
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
});

export default router;
