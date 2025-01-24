import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import {
  hasEmptyField,
  removeSpaces,
  generateHash,
  compareHash,
  maskedDetails,
  createAccessData,
  generateAccess,
} from "../helpers";
import { DetailInterface } from "../interface";
import User from "../models/user";

const profileSetup = async (req: Request, res: Response) => {
  try {
    const details = await req.body;
    const username = removeSpaces(details?.username);
    const requestUser = req.user!;

    if (username !== requestUser?.username) {
      const existsUsername = await User.findOne({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const updateDetails: DetailInterface = {
      name: details.name,
      username,
      gender: details.gender,
      bio: details.bio,
    };

    const isEmpty = hasEmptyField({
      name: details.name,
      username,
      gender: details.gender,
    });

    if (!isEmpty) {
      updateDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      { ...updateDetails },
      { new: true }
    ).select("-friends");

    if (!updatedProfile) {
      throw new ApiError(400, "Profile setup not completed!");
    } else if (!updatedProfile.setup) {
      const userData = maskedDetails(updatedProfile);
      return ApiResponse(res, 200, "Please, complete your profile!", userData);
    }

    const accessData = createAccessData(updatedProfile);
    const accessToken = generateAccess(res, accessData);

    return ApiResponse(res, 200, "Profile updated successfully!", accessData);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password } = await req.body;

    const [requestUser, hashedPassword] = await Promise.all([
      User.findById(req.user?._id).select("+password -friends"),
      generateHash(new_password),
    ]);

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const validatePassword = await compareHash(
      old_password,
      requestUser.password!
    );

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect old password!");
    }

    requestUser.password = hashedPassword;
    await requestUser.save({ validateBeforeSave: true });

    const accessData = createAccessData(requestUser);
    const accessToken = generateAccess(res, accessData);

    return ApiResponse(res, 200, "Password changed successfully!", accessData);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const userInformation = async (req: Request, res: Response) => {
  try {
    const requestUser = req.user!;

    if (requestUser?.setup) {
      return ApiResponse(res, 200, "User profile information!", requestUser);
    }
    const userData = maskedDetails(requestUser);
    return ApiResponse(res, 200, "Please, complete your profile!", userData);
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
    })
      .select("-friends")
      .lean();

    if (result.length == 0) {
      throw new ApiError(404, "No any user found!");
    }

    return ApiResponse(res, 200, "Available contacts!", result);
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

export { profileSetup, changePassword, userInformation, searchUsers };
