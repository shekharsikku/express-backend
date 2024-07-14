import { Request, Response, NextFunction } from "express";
import { ApiError, ApiResponse } from "../utils";
import { compareHash, generateHash, generateToken } from "../helper";
import { Types } from "mongoose";
import User from "../model/user";

const registerUser = async (req: Request, res: Response) => {
  try {
    const { fullname, username, email, password } = await req.body;

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      let field: string;

      if (existedUser.username == username) {
        field = "Username";
      } else {
        field = "Email";
      }
      throw new ApiError(409, `${field} already exists!`);
    }

    const hashed = await generateHash(password);

    const newUser = await User.create({
      fullname,
      username,
      email,
      password: hashed,
    });

    if (newUser) {
      return ApiResponse(req, res, 201, "Registered successfully!");
    }
    throw new ApiError(500, "Error while registering!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = await req.body;

    const user = await User.findOne({
      $or: [{ username }, { email }],
    }).select("+password");

    if (!user) {
      throw new ApiError(404, "User not registered!");
    }

    const checked = await compareHash(password, user.password);

    if (checked) {
      const uid = String(user._id);
      const { access, refresh } = generateToken(req, res, uid);

      user.refreshtoken = refresh;
      await user.save({ validateBeforeSave: false });

      return ApiResponse(req, res, 200, "Logged in successfully!", {
        id: user._id,
        token: { access, refresh },
      });
    }
    throw new ApiError(403, "Invalid user credential!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const logoutUser = async (req: Request, res: Response, _next: NextFunction) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshtoken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  res.clearCookie("access");
  res.clearCookie("refresh");
  return ApiResponse(req, res, 200, "Logged out successfully!");
};

const sessionUser = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = req.user;
    return ApiResponse(req, res, 200, "Current session user data!", data);
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const tokenRefresh = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const token = req.token;
    return ApiResponse(req, res, 200, "Token refreshed successfully!", {
      id: user?._id,
      token,
    });
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

export { registerUser, loginUser, logoutUser, sessionUser, tokenRefresh };
