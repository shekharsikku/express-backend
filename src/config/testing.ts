import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import {
  mailtrapClient,
  mailtrapSender,
  mailtrapRecipient,
} from "../config/mailtrap";

const sendEmail = async (req: Request, res: Response) => {
  try {
    const { subject, text, category } = await req.body;

    const response = await mailtrapClient.send({
      from: mailtrapSender,
      to: mailtrapRecipient,
      subject,
      text,
      category,
    });

    if (response) {
      return ApiResponse(res, 200, "Mail sent successfully!", response);
    }
    throw new ApiError(400, "Error while sending mail!");
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(res, error.code || 400, error.message);
  }
};

export { sendEmail };
