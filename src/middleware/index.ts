import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError, ApiResponse } from "../utils";
import { generateToken } from "../helper";
import User from "../model/user";
import env from "../utils/env";

/**
 * Middleware function for access resource using access token.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {NextFunction} Pass handler to next controller function if access token validate successfully.
 */
const accessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.cookies.access;

    if (!token) {
      throw new ApiError(401, "Cannot access!");
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    const user = await User.findById(decoded.uid);

    if (!decoded || !user) {
      throw new ApiError(403, "Invalid request!");
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return ApiResponse(req, res, 401, "Access expired!");
    }
    return ApiResponse(req, res, error.code, error.message);
  }
};

/**
 * Middleware function for refresh expired access token.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {NextFunction} Pass handler to next controller function if expired access token refreshed successfully.
 */
const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.cookies.refresh;

    if (!token) {
      throw new ApiError(401, "Unauthorized user!");
    }

    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
    const user = await User.findById(decoded?.uid).select("+refreshtoken");

    if (!decoded || !user || token !== user?.refreshtoken) {
      throw new ApiError(401, "Invalid request!");
    }

    const uid = String(user._id);
    const { access, refresh } = generateToken(req, res, uid);

    user.refreshtoken = refresh;
    await user.save({ validateBeforeSave: false });

    const tokens = { access, refresh };
    req.token = tokens;
    next();
  } catch (error: any) {
    return ApiResponse(req, res, error.code, error.message);
  }
};

export { accessToken, refreshToken };
