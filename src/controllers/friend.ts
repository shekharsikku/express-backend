import { ApiError, ApiResponse } from "../utils";
import { Request, Response } from "express";
import { Types } from "mongoose";
import Friend from "../models/friend";
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

    const recipientExists = await User.exists({ _id: recipient });

    if (!recipientExists) {
      throw new ApiError(404, "Recipient does not exist!");
    }

    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requester, recipient: recipient },
        { requester: recipient, recipient: requester },
      ],
      status: {
        $in: ["pending", "accepted", "rejected", "canceled", "blocked"],
      },
    });

    if (existingRequest) {
      const cooldownTime = 7 * 24 * 60 * 60 * 1000;
      const createdAtTime =
        Date.now() - new Date(existingRequest.createdAt!).getTime();

      if (existingRequest.status === "pending") {
        throw new ApiError(400, "Friend request already sent!");
      }

      if (existingRequest.status === "accepted") {
        throw new ApiError(400, "You both are already friends!");
      }

      if (["rejected", "canceled"].includes(existingRequest.status)) {
        if (createdAtTime < cooldownTime) {
          const remainingDays = Math.ceil(
            (cooldownTime - createdAtTime) / (1000 * 60 * 60 * 24)
          );
          throw new ApiError(
            400,
            `You can send a new request after ${remainingDays} days!`
          );
        }
      }

      if (existingRequest.status === "blocked") {
        throw new ApiError(
          400,
          "You cannot send a request. User has blocked you!"
        );
      }
    }

    await Friend.create({ requester, recipient });

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
      throw new ApiError(400, "Requester required for handle request!");
    }

    if (!["accept", "reject"].includes(action)) {
      throw new ApiError(400, "Action must be either 'accept' or 'reject'!");
    }

    const updatedResult = await Friend.updateOne(
      { requester, recipient, status: "pending" },
      { $set: { status: action === "accept" ? "accepted" : "rejected" } }
    );

    if (updatedResult.matchedCount === 0) {
      throw new ApiError(404, "Friend request not found or already processed!");
    }

    return ApiResponse(res, 200, `Friend request ${action}ed successfully!`);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};


/*
const retrieveRequest = async (req: Request, res: Response) => {
  try {
    const requester = req.user?._id;
    const recipient = req.query.from as string;

    const response = await Requests.updateOne(
      {
        requester,
        recipient,
        status: "pending",
      },
      {
        status: "retrieved",
      }
    );

    if (response.modifiedCount > 0) {
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

    const current = await User.findByIdAndUpdate(user._id, {
      $pull: { friends: friend._id },
    });

    const other = await User.findByIdAndUpdate(friend._id, {
      $pull: { friends: user._id },
    });

    if (current && other) {
      const result = await Requests.deleteOne({
        status: "accepted",
        $or: [
          { requester: user._id, recipient: friend._id },
          { requester: friend._id, recipient: user._id },
        ],
      });

      let message = "";

      if (result.deletedCount > 0) {
        message = "Friend removed successfully!";
      } else {
        message = "No matching friendship found!";
      }

      return ApiResponse(res, 200, message);
    }

    throw new ApiError(400, "Error while removing user from friend!");
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
*/
export {
  sendRequest,
  handleRequest,
  // retrieveRequest,
  // pendingRequests,
  // unfriendUser,
  // fetchFriends,
};
