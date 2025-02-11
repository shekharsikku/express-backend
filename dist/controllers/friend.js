"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFriends = exports.unfriendUser = exports.pendingRequests = exports.retrieveRequest = exports.handleRequest = exports.sendRequest = void 0;
const utils_1 = require("../utils");
const mongoose_1 = require("mongoose");
const friend_1 = __importDefault(require("../models/friend"));
const user_1 = __importDefault(require("../models/user"));
const sendRequest = async (req, res) => {
    try {
        const requester = req.user?._id;
        const recipient = req.query.to;
        if (!recipient) {
            throw new utils_1.ApiError(400, "Recipient required for send request!");
        }
        if (requester?.toString() === recipient) {
            throw new utils_1.ApiError(400, "You cannot send a request to yourself!");
        }
        const recipientExists = await user_1.default.exists({ _id: recipient });
        if (!recipientExists) {
            throw new utils_1.ApiError(404, "Recipient does not exist!");
        }
        const existingRequest = await friend_1.default.findOne({
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
            const createdAtTime = Date.now() - new Date(existingRequest.createdAt).getTime();
            if (existingRequest.status === "pending") {
                throw new utils_1.ApiError(400, "Friend request already sent!");
            }
            if (existingRequest.status === "accepted") {
                throw new utils_1.ApiError(400, "You both are already friends!");
            }
            if (["rejected", "canceled"].includes(existingRequest.status)) {
                if (createdAtTime < cooldownTime) {
                    const remainingDays = Math.ceil((cooldownTime - createdAtTime) / (1000 * 60 * 60 * 24));
                    throw new utils_1.ApiError(400, `You can send a new request after ${remainingDays} days!`);
                }
            }
            if (existingRequest.status === "blocked") {
                throw new utils_1.ApiError(400, "You cannot send a request. User has blocked you!");
            }
        }
        await friend_1.default.create({ requester, recipient });
        return (0, utils_1.ApiResponse)(res, 200, "Friend request sent successfully!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.sendRequest = sendRequest;
const handleRequest = async (req, res) => {
    try {
        const recipient = req.user?._id;
        const requester = req.query.from;
        const action = req.query.action;
        if (!requester) {
            throw new utils_1.ApiError(400, "Requester required for handle request!");
        }
        if (!["accept", "reject"].includes(action)) {
            throw new utils_1.ApiError(400, "Action must be either 'accept' or 'reject'!");
        }
        const updatedResult = await friend_1.default.updateOne({ requester, recipient, status: "pending" }, { $set: { status: action === "accept" ? "accepted" : "rejected" } });
        if (updatedResult.matchedCount === 0) {
            throw new utils_1.ApiError(404, "Friend request not found or already processed!");
        }
        return (0, utils_1.ApiResponse)(res, 200, `Friend request ${action}ed successfully!`);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.handleRequest = handleRequest;
const retrieveRequest = async (req, res) => {
    try {
        const requester = req.user?._id;
        const recipient = req.query.from;
        const cancelResponse = await friend_1.default.updateOne({ requester, recipient, status: "pending" }, { $set: { status: "canceled" } });
        if (cancelResponse.modifiedCount > 0) {
            return (0, utils_1.ApiResponse)(res, 200, "Friend request cancelled!");
        }
        throw new utils_1.ApiError(400, "No pending request found to cancel!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.retrieveRequest = retrieveRequest;
const pendingRequests = async (req, res) => {
    try {
        const uid = new mongoose_1.Types.ObjectId(req.user?._id);
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
        const [result] = await friend_1.default.aggregate(pipeline);
        return (0, utils_1.ApiResponse)(res, 200, "Pending request fetched!", {
            sent: result?.sent || [],
            received: result?.received || [],
        });
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.pendingRequests = pendingRequests;
const unfriendUser = async (req, res) => {
    try {
        const uid = req.user?._id;
        const fid = req.query.friend;
        if (!fid) {
            throw new utils_1.ApiError(400, "Friend id is required!");
        }
        const unfriendResult = await friend_1.default.deleteOne({
            status: "accepted",
            $or: [
                { requester: uid, recipient: fid },
                { requester: fid, recipient: uid },
            ],
        });
        if (unfriendResult.deletedCount > 0) {
            return (0, utils_1.ApiResponse)(res, 200, "Friend removed successfully!");
        }
        return (0, utils_1.ApiResponse)(res, 400, "No matching friendship found!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
};
exports.unfriendUser = unfriendUser;
const fetchFriends = async (req, res) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.user?._id);
        const friends = await friend_1.default.aggregate([
            {
                $match: {
                    status: "accepted",
                    $or: [{ requester: userId }, { recipient: userId }],
                },
            },
            {
                $addFields: {
                    friendId: {
                        $cond: {
                            if: { $eq: ["$requester", userId] },
                            then: "$recipient",
                            else: "$requester",
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "friendId",
                    foreignField: "_id",
                    as: "friendData",
                },
            },
            { $unwind: { path: "$friendData", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    friendFrom: "$updatedAt",
                    friendId: "$friendData._id",
                    name: "$friendData.name",
                    email: "$friendData.email",
                    username: "$friendData.username",
                    image: "$friendData.image",
                    bio: "$friendData.bio",
                    gender: "$friendData.gender",
                },
            },
        ]);
        if (!friends.length) {
            throw new utils_1.ApiError(404, "No any friends found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Friends fetched successfully!", friends);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message);
    }
};
exports.fetchFriends = fetchFriends;
