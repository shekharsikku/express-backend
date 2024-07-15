import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import { compareHash, generateHash, generateToken } from "../helper";
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
      const { access, refresh } = generateToken(req, res, user._id);

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

const logoutUser = async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user?._id,
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

const currentUser = async (req: Request, res: Response) => {
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

const changeCurrentPassword = async (req: Request, res: Response) => {
  try {
    const { old_password, new_password } = await req.body;

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      throw new ApiError(400, "Invalid change request!");
    }

    const checked = await compareHash(old_password, user?.password!);

    if (!checked) {
      throw new ApiError(403, "Invalid old password!");
    }

    user.password = await generateHash(new_password);
    await user.save({ validateBeforeSave: false });

    return ApiResponse(req, res, 202, "Password changed successfully!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

interface UpdateUserObject {
  username?: string;
  email?: string;
  fullname?: string;
}

const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const { fullname, email, username } = await req.body;

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      let field;

      if (existedUser.username == username) {
        field = "Username";
      } else {
        field = "Email";
      }
      throw new ApiError(409, `${field} already exists!`);
    }

    const updateObject: UpdateUserObject = {};

    if (username) updateObject.username = username;
    if (email) updateObject.email = email;
    if (fullname) updateObject.fullname = fullname;

    const result = await User.updateOne(
      { _id: req.user?._id },
      { $set: updateObject }
    );

    if (result.modifiedCount === 1) {
      return ApiResponse(req, res, 200, "Details updated successfully!");
    }
    throw new ApiError(500, "Details not updated!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

const deleteUserDetails = async (req: Request, res: Response) => {
  try {
    const { current_password } = await req.body;

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      throw new ApiError(400, "Invalid delete request!");
    }

    const checked = await compareHash(current_password, user.password);

    if (checked) {
      const deletedUser = await user.deleteOne();

      if (deletedUser.deletedCount === 1) {
        res.clearCookie("access");
        res.clearCookie("refresh");
        return ApiResponse(req, res, 301, "User details deleted successfully!");
      }
    }
    throw new ApiError(403, "Invalid user password!");
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  tokenRefresh,
  changeCurrentPassword,
  updateUserDetails,
  deleteUserDetails,
};
