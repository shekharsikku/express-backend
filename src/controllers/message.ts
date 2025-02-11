import { Types } from "mongoose";
import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import Conversation from "../models/conversation";
import Message from "../models/message";

const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;
    const { type, text, file } = await req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
      });
    }

    const message = new Message({
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

    /** Handle socket event for realtime messaging */

    return ApiResponse(res, 201, "Message sent successfully!", message);
  } catch (error: any) {
    console.error("Error:", error.message);
    return ApiResponse(res, 500, "Error while sending message!");
  }
};

const cleanupConversation = async (conversationId: Types.ObjectId) => {
  const conversations = await Conversation.findById(conversationId).lean();

  if (conversations && conversations.messages.length > 0) {
    const validMessages = await Message.find({
      _id: { $in: conversations.messages },
    }).distinct("_id");

    if (validMessages.length !== conversations.messages.length) {
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { messages: validMessages } }
      );
    }
  }
};

const getMessages = async (req: Request, res: Response) => {
  try {
    const sender = req.user?._id;
    const receiver = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    })
      .populate("messages")
      .lean();

    if (!conversation) {
      return ApiResponse(res, 200, "No any message available!", []);
    }

    await cleanupConversation(conversation._id);
    const messages = conversation.messages;

    return ApiResponse(res, 200, "Messages fetched successfully!", messages);
  } catch (error: any) {
    return ApiResponse(res, 500, "Error while fetching messages!");
  }
};

const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const msgId = req.params.id;
    const { text } = await req.body;

    if (!text) {
      throw new ApiError(400, "Text content is required for editing!");
    }

    const message = await Message.findOneAndUpdate(
      { _id: msgId, sender: userId, "content.type": "text" },
      {
        type: "edited",
        "content.text": text,
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't edit this message or message not found!"
      );
    }

    return ApiResponse(res, 200, "Message edited successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Error while editing message!"
    );
  }
};

const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const msgId = req.params.id;

    const message = await Message.findOneAndUpdate(
      { _id: msgId, sender: userId },
      {
        type: "deleted",
        deletedAt: new Date(),
        $unset: { content: 1 },
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't delete this message or message not found!"
      );
    }

    return ApiResponse(res, 200, "Message deleted successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Error while deleting message!"
    );
  }
};

const deleteMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const result = await Message.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
      createdAt: { $lt: hoursAgo },
    });

    return ApiResponse(res, 200, "Older messages deleted!", result);
  } catch (error: any) {
    return ApiResponse(res, 500, "Error while deleting messages!");
  }
};

export { sendMessage, getMessages, editMessage, deleteMessage, deleteMessages };
