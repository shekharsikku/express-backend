import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError, ApiResponse } from "../utils";
import { generateToken } from "../helper";
import User from "../model/user";
import env from "../utils/env";

const tokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt || req.session.token;

    if (!token) {
      throw new ApiError(401, "Missing token!");
    }

    const decoded = jwt.verify(token, env.TOKEN_SECRET) as JwtPayload;
    const user = await User.findById(decoded.uid);

    if (!decoded || !user) {
      throw new ApiError(403, "Invalid token!");
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return ApiResponse(req, res, 401, "Token expired!");
    }
    return ApiResponse(req, res, error.code, error.message);
  }
};

const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    generateToken(req, res, req.session.user);
    next();
  } else {
    return ApiResponse(req, res, 401, "Unauthorized user!");
  }
};

export { tokenMiddleware, sessionMiddleware };
