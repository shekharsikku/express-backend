import { Router } from "express";
import { authAccess } from "../middlewares";
import {
  sendRequest,
  handleRequest,
  retrieveRequest,
  pendingRequests,
  unfriendUser,
  fetchFriends,
} from "../controllers/friend";

const router = Router();

router.post("/request-send", authAccess, sendRequest);
router.patch("/request-handle", authAccess, handleRequest);

router.delete("/request-retrieve", authAccess, retrieveRequest);
router.delete("/unfriend", authAccess, unfriendUser);

router.get("/request-pending", authAccess, pendingRequests);
router.get("/fetch", authAccess, fetchFriends);

export default router;
