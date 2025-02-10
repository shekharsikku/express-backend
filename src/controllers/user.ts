import { Request, Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { ApiError, ApiResponse } from "../utils";
import { setData } from "../utils/redis";
import { hasEmptyField, createUserInfo, generateAccess } from "../helpers";
import User from "../models/user";

const profileSetup = async (req: Request, res: Response) => {
  try {
    const { name, username, gender, bio } = await req.body;
    const requestUser = req.user!;

    if (username !== requestUser?.username) {
      const existsUsername = await User.exists({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const userDetails = { name, username, gender, bio, setup: false };
    const isCompleted = !hasEmptyField({ name, username, gender });

    if (isCompleted) {
      userDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      userDetails,
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(400, "Profile setup not completed!");
    }

    const userInfo = createUserInfo(updatedProfile);

    if (!userInfo.setup) {
      return ApiResponse(res, 200, "Please, complete your profile!", userInfo);
    }

    generateAccess(res, userInfo._id!);
    await setData(userInfo);

    return ApiResponse(res, 200, "Profile updated successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password } = await req.body;

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const requestUser = await User.findById(req.user?._id).select("+password");

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    const isCorrect = await compare(old_password, requestUser.password!);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect old password!");
    }

    const hashSalt = await genSalt(12);
    requestUser.password = await hash(new_password, hashSalt);
    await requestUser.save({ validateBeforeSave: true });

    const userInfo = createUserInfo(requestUser);
    generateAccess(res, userInfo._id!);
    await setData(userInfo);

    return ApiResponse(res, 200, "Password changed successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const userInformation = async (req: Request, res: Response) => {
  try {
    const requestUser = req.user!;

    const responseMessage = requestUser?.setup
      ? "User profile information!"
      : "Please, complete your profile!";

    return ApiResponse(res, 200, responseMessage, requestUser);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const searchUsers = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;

    if (!search) {
      throw new ApiError(400, "Search query is required!");
    }

    const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(terms, "i");

    const result = await User.find({
      $and: [
        { _id: { $ne: req.user?._id } },
        { setup: true },
        { $or: [{ name: regex }, { username: regex }, { email: regex }] },
      ],
    }).lean();

    if (result.length == 0) {
      throw new ApiError(404, "No any user found!");
    }

    return ApiResponse(res, 200, "Available contacts!", result);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

export { profileSetup, changePassword, userInformation, searchUsers };
