import { NextFunction, Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import { UserInterface, TokenInterface } from "../interface";
import { Types } from "mongoose";
import {
  generateAccess,
  generateRefresh,
  createAccessData,
  authorizeCookie,
} from "../helpers";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user";
import env from "../utils/env";
import multer from "multer";

const authAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const accessToken = req.cookies.access;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized access request!");
    }

    let decodedPayload;

    try {
      decodedPayload = jwt.verify(accessToken, env.ACCESS_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload;
    } catch (error: any) {
      throw new ApiError(403, "Invalid access request!");
    }

    req.user = decodedPayload.user as UserInterface;
    next();
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const authRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const refreshToken = req.cookies.refresh;
    const authorizeId = req.cookies.session;

    if (!refreshToken || authorizeId) {
      throw new ApiError(401, "Unauthorized refresh request!");
    }

    let decodedPayload;

    try {
      decodedPayload = jwt.verify(refreshToken, env.REFRESH_SECRET, {
        algorithms: ["HS512"],
        ignoreExpiration: true,
        ignoreNotBefore: true,
      }) as JwtPayload;
    } catch (error: any) {
      throw new ApiError(403, "Invalid refresh request!");
    }

    const userId = decodedPayload.uid as Types.ObjectId;
    const currentTime = Math.floor(Date.now() / 1000);
    const beforeExpires = decodedPayload.exp! - env.ACCESS_EXPIRY;

    const requestUser = await User.findOne({
      _id: userId,
      authentication: {
        $elemMatch: {
          _id: authorizeId,
          token: refreshToken,
        },
      },
    });

    if (!requestUser) {
      throw new ApiError(403, "Invalid user request!");
    }

    let authTokens: TokenInterface = {};
    const accessData = createAccessData(requestUser);

    if (currentTime >= beforeExpires && currentTime < decodedPayload.exp!) {
      const newRefreshToken = generateRefresh(res, userId);
      const refreshExpiry = env.REFRESH_EXPIRY;

      const updatedAuth = await User.updateOne(
        {
          _id: userId,
          authentication: {
            $elemMatch: { _id: authorizeId, token: refreshToken },
          },
        },
        {
          $set: {
            "authentication.$.token": newRefreshToken,
            "authentication.$.expiry": new Date(
              Date.now() + refreshExpiry * 1000
            ),
          },
        }
      );

      if (updatedAuth.modifiedCount > 0) {
        authorizeCookie(res, authorizeId!);
        const accessToken = generateAccess(res, accessData);
        authTokens.access = accessToken;
        authTokens.refresh = newRefreshToken;
      } else {
        throw new ApiError(403, "Invalid refresh request!");
      }
    } else if (currentTime >= decodedPayload.exp!) {
      await User.updateOne(
        { _id: userId },
        {
          $pull: {
            authentication: { _id: authorizeId, token: refreshToken },
          },
        }
      );

      res.clearCookie("access");
      res.clearCookie("refresh");
      res.clearCookie("session");

      throw new ApiError(401, "Please, login again to continue!");
    } else {
      const accessToken = generateAccess(res, accessData);
      authTokens.access = accessToken;
    }

    req.user = accessData;
    req.token = authTokens;
    next();
  } catch (error: any) {
    return ApiResponse(res, error.code, error.message);
  }
};

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (_req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

export { authAccess, authRefresh, upload };
