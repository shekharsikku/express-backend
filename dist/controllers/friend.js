"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFriends = exports.unfriendUser = exports.pendingRequests = exports.retrieveRequest = exports.handleRequest = exports.sendRequest = void 0;
const utils_1 = require("../utils");
const mongoose_1 = require("mongoose");
const request_1 = __importDefault(require("../models/request"));
const user_1 = __importDefault(require("../models/user"));
const sendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requester = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const recipient = req.query.to;
        if (!recipient) {
            throw new utils_1.ApiError(400, "Recipient required for send request!");
        }
        if ((requester === null || requester === void 0 ? void 0 : requester.toString()) === recipient) {
            throw new utils_1.ApiError(400, "You cannot send a request to yourself!");
        }
        const exists = yield user_1.default.findById(recipient);
        if (!exists) {
            throw new utils_1.ApiError(404, "Recipient does not exist!");
        }
        if (exists.friends.includes(requester)) {
            throw new utils_1.ApiError(400, "You both are already friends!");
        }
        const existing = yield request_1.default.findOne({
            requester,
            recipient,
            status: { $in: ["pending", "accepted", "rejected", "retrieved"] },
        });
        if (existing) {
            let message = "";
            switch (existing.status) {
                case "pending":
                    message = "Friend request already sent!";
                    break;
                case "accepted":
                    message = "You both are already friends!";
                    break;
                case "rejected":
                    message = "You are unable to send request!";
                    break;
                case "retrieved":
                    message = "You can send request after few days!";
                    break;
                default:
                    message = "Unable to send request currently!";
            }
            throw new utils_1.ApiError(400, message);
        }
        yield request_1.default.create({ requester, recipient });
        return (0, utils_1.ApiResponse)(res, 200, "Friend request sent successfully!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.sendRequest = sendRequest;
const handleRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const recipient = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const requester = req.query.from;
        const action = req.query.action;
        if (!requester) {
            throw new utils_1.ApiError(400, "Requester required for reject request!");
        }
        if (!["accept", "reject"].includes(action)) {
            throw new utils_1.ApiError(400, "Action must be either 'accept' or 'reject'!");
        }
        const request = yield request_1.default.findOne({
            requester,
            recipient,
            status: "pending",
        });
        if (!request) {
            throw new utils_1.ApiError(404, "Friend request not found!");
        }
        if (action === "accept") {
            request.status = "accepted";
            yield request.save();
            yield user_1.default.findByIdAndUpdate(recipient, {
                $addToSet: { friends: requester },
            });
            yield user_1.default.findByIdAndUpdate(requester, {
                $addToSet: { friends: recipient },
            });
            return (0, utils_1.ApiResponse)(res, 200, "Friend request accepted!");
        }
        else if (action === "reject") {
            request.status = "rejected";
            yield request.save();
            return (0, utils_1.ApiResponse)(res, 200, "Friend request rejected!");
        }
        throw new utils_1.ApiError(400, "Error occurred while handling request!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.handleRequest = handleRequest;
const retrieveRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requester = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const recipient = req.query.from;
        const response = yield request_1.default.findOneAndUpdate({
            requester,
            recipient,
            status: "pending",
        }, {
            status: "retrieved",
        });
        if (response) {
            return (0, utils_1.ApiResponse)(res, 200, "Friend request retrieved!");
        }
        throw new utils_1.ApiError(400, "No request found to retrieve!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.retrieveRequest = retrieveRequest;
const pendingRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = new mongoose_1.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
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
        const [result] = yield request_1.default.aggregate(pipeline);
        return (0, utils_1.ApiResponse)(res, 200, "Pending request fetched!", {
            sent: (result === null || result === void 0 ? void 0 : result.sent) || [],
            received: (result === null || result === void 0 ? void 0 : result.received) || [],
        });
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.pendingRequests = pendingRequests;
const unfriendUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const fid = req.query.friend;
        if (!fid) {
            throw new utils_1.ApiError(400, "Friend id is required!");
        }
        const user = yield user_1.default.findById(uid);
        const friend = yield user_1.default.findById(fid);
        if (!user || !friend) {
            throw new utils_1.ApiError(404, "User not found!");
        }
        if (!user.friends.includes(friend._id) ||
            !friend.friends.includes(user._id)) {
            throw new utils_1.ApiError(400, "You are not friend with this user!");
        }
        const current = yield user_1.default.findByIdAndUpdate(user._id, {
            $pull: { friends: friend._id },
        });
        const other = yield user_1.default.findByIdAndUpdate(friend._id, {
            $pull: { friends: user._id },
        });
        if (current && other) {
            const result = yield request_1.default.deleteOne({
                status: "accepted",
                $or: [
                    { requester: user._id, recipient: friend._id },
                    { requester: friend._id, recipient: user._id },
                ],
            });
            let message = "";
            if (result.deletedCount > 0) {
                message = "Friend removed successfully!";
            }
            else {
                message = "No matching friendship found!";
            }
            return (0, utils_1.ApiResponse)(res, 200, message);
        }
        throw new utils_1.ApiError(400, "Error while removing user from friend!");
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.unfriendUser = unfriendUser;
const fetchFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = yield user_1.default.findById(uid)
            .populate("friends", "name email username image bio gender")
            .lean();
        if (!user) {
            throw new utils_1.ApiError(404, "User not found");
        }
        const friends = (user === null || user === void 0 ? void 0 : user.friends) || [];
        return (0, utils_1.ApiResponse)(res, 200, "Friend list fetched!", friends);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code, error.message);
    }
});
exports.fetchFriends = fetchFriends;
