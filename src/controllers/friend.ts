import { ApiError, ApiResponse } from "../utils";
import { Request, Response } from "express";
import { Types } from "mongoose";
import Requests from "../models/request";
import User from "../models/user";

const sendRequest = async (req: Request, res: Response) => {
  try {
    const requester = req.user?._id;
    const recipient = req.query.to as string;

    if (!recipient) {
      throw new ApiError(400, "Recipient required for send request!");
    }

    if (requester?.toString() === recipient) {
      throw new ApiError(400, "You cannot send a request to yourself!");
    }

    const exists = await User.findById(recipient);

    if (!exists) {
      throw new ApiError(404, "Recipient does not exist!");
    }

    const existing = await Requests.findOne({
      requester,
      recipient,
      status: { $in: ["pending", "accepted", "rejected"] },
    });

    if (existing) {
      switch (existing.status) {
        case "pending":
          throw new ApiError(400, "Friend request already sent!");
        case "accepted":
          throw new ApiError(400, "You both are already friends!");
        case "rejected":
          throw new ApiError(403, "You can't able to send request!");
      }
    }

    await Requests.create({ requester, recipient });

    /** handle a request notification here in via socket.io */

    return ApiResponse(res, 200, "Friend request sent successfully!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const handleRequest = async (req: Request, res: Response) => {
  try {
    const recipient = req.user?._id;
    const requester = req.query.from as string;
    const action = req.query.action as string;

    if (!requester) {
      throw new ApiError(400, "Requester required for reject request!");
    }

    if (!["accept", "reject"].includes(action)) {
      throw new ApiError(400, "Action must be either 'accept' or 'reject'!");
    }

    const request = await Requests.findOne({
      requester,
      recipient,
      status: "pending",
    });

    if (!request) {
      throw new ApiError(404, "Friend request not found");
    }

    if (action === "accept") {
      request.status = "accepted";
      await request.save();

      await User.findByIdAndUpdate(recipient, {
        $addToSet: { friends: requester },
      });

      await User.findByIdAndUpdate(requester, {
        $addToSet: { friends: recipient },
      });

      return ApiResponse(res, 200, "Friend request accepted!");
    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();

      return ApiResponse(res, 200, "Friend request rejected!");
    }

    throw new ApiError(400, "Error occurred while handling request!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const retrieveRequest = async (req: Request, res: Response) => {
  try {
    const requester = req.user?._id;
    const recipient = req.query.from as string;

    const response = await Requests.findOneAndDelete({
      requester,
      recipient,
      status: "pending",
    });

    if (response) {
      return ApiResponse(res, 200, "Friend request retrieved!");
    }

    throw new ApiError(400, "No request found to retrieve!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const pendingRequests = async (req: Request, res: Response) => {
  try {
    const uid = new Types.ObjectId(req.user?._id);

    const pipeline = [
      {
        $match: {
          $or: [
            { requester: uid, status: "pending" },
            { recipient: uid, status: "pending" },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "requester",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                email: 1,
                image: 1,
                bio: 1,
                gender: 1,
              },
            },
          ],
          as: "requesterDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                email: 1,
                image: 1,
                bio: 1,
                gender: 1,
              },
            },
          ],
          as: "recipientDetails",
        },
      },
      {
        $project: {
          _id: 0,
          requester: 1,
          recipient: 1,
          requesterDetails: {
            $arrayElemAt: ["$requesterDetails", 0],
          },
          recipientDetails: {
            $arrayElemAt: ["$recipientDetails", 0],
          },
          at: "$createdAt",
        },
      },
      {
        $facet: {
          sent: [
            {
              $match: { requester: uid },
            },
            {
              $project: {
                at: 1,
                user: "$recipientDetails",
              },
            },
          ],
          received: [
            {
              $match: { recipient: uid },
            },
            {
              $project: {
                at: 1,
                user: "$requesterDetails",
              },
            },
          ],
        },
      },
    ];

    const [result] = await Requests.aggregate(pipeline);

    return ApiResponse(res, 200, "Pending request fetched!", {
      sent: result?.sent || [],
      received: result?.received || [],
    });
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const unfriendUser = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id;
    const fid = req.query.friend as string;

    if (!fid) {
      throw new ApiError(400, "Friend id is required!");
    }

    const user = await User.findById(uid);
    const friend = await User.findById(fid);

    if (!user || !friend) {
      throw new ApiError(404, "User not found!");
    }

    if (
      !user.friends.includes(friend._id) ||
      !friend.friends.includes(user._id)
    ) {
      throw new ApiError(400, "You are not friend with this user!");
    }

    await User.findByIdAndUpdate(user, {
      $pull: { friends: friend },
    });

    await User.findByIdAndUpdate(friend, {
      $pull: { friends: user },
    });

    return ApiResponse(res, 200, "Friend removed successfully!");
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const fetchFriends = async (req: Request, res: Response) => {
  try {
    const uid = req.user?._id!;

    const user = await User.findById(uid)
      .populate("friends", "name email username image bio gender")
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
  handleRequest,
  retrieveRequest,
  pendingRequests,
  unfriendUser,
  fetchFriends,
};
