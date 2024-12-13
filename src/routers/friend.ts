import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  sendRequest,
  rejectRequest,
  acceptRequest,
  // pendingRequests,
  // unfriendUser,
  fetchFriends,
} from "../controllers/friend";

const router = Router();

router.post("/request/send", authAccess, sendRequest);

router.patch("/request/reject", authAccess, rejectRequest);
router.patch("/request/accept", authAccess, acceptRequest);

// router.patch("/unfriend", authAccess, unfriendUser);

// router.get("/request/pending", authAccess, pendingRequests);
router.get("/fetch", authAccess, fetchFriends);

export default router;
