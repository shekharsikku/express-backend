"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessages = exports.deleteMessage = exports.editMessage = exports.getMessages = exports.sendMessage = void 0;
const utils_1 = require("../utils");
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const sendMessage = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const { type, text, file } = await req.body;
        let conversation = await conversation_1.default.findOne({
            participants: { $all: [sender, receiver] },
        });
        if (!conversation) {
            conversation = await conversation_1.default.create({
                participants: [sender, receiver],
            });
        }
        const message = new message_1.default({
            sender: sender,
            recipient: receiver,
            content: {
                type: type,
                text: text,
                file: file,
            },
        });
        if (message) {
            conversation.messages.push(message._id);
            conversation.interaction = new Date(Date.now());
        }
        await Promise.all([conversation.save(), message.save()]);
        return (0, utils_1.ApiResponse)(res, 201, "Message sent successfully!", message);
    }
    catch (error) {
        console.error("Error:", error.message);
        return (0, utils_1.ApiResponse)(res, 500, "Error while sending message!");
    }
};
exports.sendMessage = sendMessage;
const cleanupConversation = async (conversationId) => {
    const conversations = await conversation_1.default.findById(conversationId).lean();
    if (conversations && conversations.messages.length > 0) {
        const validMessages = await message_1.default.find({
            _id: { $in: conversations.messages },
        }).distinct("_id");
        if (validMessages.length !== conversations.messages.length) {
            await conversation_1.default.updateOne({ _id: conversationId }, { $set: { messages: validMessages } });
        }
    }
};
const getMessages = async (req, res) => {
    try {
        const sender = req.user?._id;
        const receiver = req.params.id;
        const conversation = await conversation_1.default.findOne({
            participants: { $all: [sender, receiver] },
        })
            .populate("messages")
            .lean();
        if (!conversation) {
            return (0, utils_1.ApiResponse)(res, 200, "No any message available!", []);
        }
        await cleanupConversation(conversation._id);
        const messages = conversation.messages;
        return (0, utils_1.ApiResponse)(res, 200, "Messages fetched successfully!", messages);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Error while fetching messages!");
    }
};
exports.getMessages = getMessages;
const editMessage = async (req, res) => {
    try {
        const userId = req.user?._id;
        const msgId = req.params.id;
        const { text } = await req.body;
        if (!text) {
            throw new utils_1.ApiError(400, "Text content is required for editing!");
        }
        const message = await message_1.default.findOneAndUpdate({ _id: msgId, sender: userId, "content.type": "text" }, {
            type: "edited",
            "content.text": text,
        }, { new: true });
        if (!message) {
            throw new utils_1.ApiError(403, "You can't edit this message or message not found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Message edited successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message || "Error while editing message!");
    }
};
exports.editMessage = editMessage;
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user?._id;
        const msgId = req.params.id;
        const message = await message_1.default.findOneAndUpdate({ _id: msgId, sender: userId }, {
            type: "deleted",
            deletedAt: new Date(),
            $unset: { content: 1 },
        }, { new: true });
        if (!message) {
            throw new utils_1.ApiError(403, "You can't delete this message or message not found!");
        }
        return (0, utils_1.ApiResponse)(res, 200, "Message deleted successfully!", message);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, error.code || 500, error.message || "Error while deleting message!");
    }
};
exports.deleteMessage = deleteMessage;
const deleteMessages = async (req, res) => {
    try {
        const userId = req.user?._id;
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - 24);
        const result = await message_1.default.deleteMany({
            $or: [{ sender: userId }, { recipient: userId }],
            createdAt: { $lt: hoursAgo },
        });
        return (0, utils_1.ApiResponse)(res, 200, "Older messages deleted!", result);
    }
    catch (error) {
        return (0, utils_1.ApiResponse)(res, 500, "Error while deleting messages!");
    }
};
exports.deleteMessages = deleteMessages;
