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

    if (user && req.session.user) {
      if (String(user._id) === String(req.session.user)) {
        generateToken(req, res, user._id as Types.ObjectId);

        const data = {
          sid: req.session.id,
          uid: req.session.user,
          jwt: req.session.token,
        };
        return ApiResponse(req, res, 302, "Welcome, already logged in!", data);
      }
    }

    const checked = await compareHash(password, user.password);

    if (checked) {
      req.session.user = user._id as Types.ObjectId;
      generateToken(req, res, user._id as Types.ObjectId);

      const data = {
        sid: req.session.id,
        uid: req.session.user,
        jwt: req.session.token,
      };
      return ApiResponse(req, res, 200, "Logged in successfully!", data);
    }
    throw new ApiError(403, "Invalid user credential!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(function (error) {
    if (error) {
      next(error);
    } else {
      res.clearCookie("jwt");
      res.clearCookie("session");
      return ApiResponse(req, res, 200, "Logged out successfully!");
    }
  });
};

const sessionUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = {
      sid: req.session.id,
      uid: req.session.user,
      jwt: req.session.token,
      user: req.user,
    };
    return ApiResponse(req, res, 200, "Current session user data!", data);
  } catch (error: any) {
    next(error);
  }
};

export { registerUser, loginUser, logoutUser, sessionUser };
