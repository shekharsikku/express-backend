import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import Requests from "../models/request";
import User from "../models/user";

const sendRequest = async (req: Request, res: Response) => {
  try {
    const requester = req.user?._id;
    const recipient = req.query.to as string;

    if (!recipient) {
      throw new ApiError(400, "Recipient required for send request!");
    }

    const existing = await Requests.findOne({ requester, recipient });

    if (existing) {
      throw new ApiError(400, "Friend request already sent!");
    }

    const response = await Requests.create({
      requester,
      recipient,
    });

    return ApiResponse(res, 200, "Friend request sent successfully!", response);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const rejectRequest = async (req: Request, res: Response) => {
  try {
    const recipient = req.user?._id;
    const requester = req.query.from as string;

    if (!requester) {
      throw new ApiError(400, "Requester required for reject request!");
    }

    const response = await Requests.findOneAndDelete({
      requester,
      recipient,
    });

    if (response) {
      return ApiResponse(res, 200, "Friend request rejected!", response);
    }

    throw new ApiError(400, "No request found to reject!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const acceptRequest = async (req: Request, res: Response) => {
  try {
    const recipient = req.user?._id;
    const requester = req.query.from as string;

    const result = await Requests.findOneAndDelete({
      requester,
      recipient,
    });

    if (result) {
      await User.findByIdAndUpdate(recipient, {
        $push: { friends: requester },
      });

      await User.findByIdAndUpdate(requester, {
        $push: { friends: recipient },
      });

      return ApiResponse(res, 200, "Friend request accepted!", {
        result,
      });
    }

    throw new ApiError(400, "No request found to accept!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

/*

const pendingRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user?._id;

    const pending = await Requests.findOne(
      { user },
      {
        requests: {
          $elemMatch: { status: "pending" },
        },
      }
    ).populate("requests.from", "name email");

    const requests = pending?.requests || [];

    return ApiResponse(res, 200, "Pending request fetched!", requests);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const unfriendUser = async (req: Request, res: Response) => {
  try {
    const user = req.user?._id;
    const friend = req.query.friend;

    const res1 = await User.findByIdAndUpdate(user, {
      $pull: { friends: friend },
    });
    const res2 = await User.findByIdAndUpdate(friend, {
      $pull: { friends: user },
    });

    return ApiResponse(res, 200, "Friend removed successfully!", {
      res1,
      res2,
    });
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};
*/

const fetchFriends = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id!;

    const user = await User.findById(uid)
      .populate("friends", "name username email image bio gender")
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const friends = user?.friends || [];

    return ApiResponse(res, 200, "Friend list fetched!", friends);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

export {
  sendRequest,
  rejectRequest,
  acceptRequest,
  // pendingRequests,
  // unfriendUser,
  fetchFriends,
};
