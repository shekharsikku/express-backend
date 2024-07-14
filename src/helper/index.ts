import { NextFunction, Request, Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { ZodSchema } from "zod";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { ApiResponse, ValidationError } from "../utils";
import env from "../utils/env";

/**
 * Generate hash of plain password.
 *
 * @async
 * @param {string} password Plain password.
 * @returns {Promise<string>} Hashed password.
 */
const generateHash = async (password: string): Promise<string> => {
  const salt = await genSalt(13);
  const hashed = await hash(password, salt);
  return hashed;
};

/**
 * Compare plain password and hashed password.
 *
 * @async
 * @param {string} password Plain password.
 * @param {string} hashed Hashed password.
 * @returns {Promise<boolean>} Return boolean result after comparing plain and hashed password.
 */
const compareHash = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  const checked = await compare(password, hashed);
  return checked;
};

/** Validate incoming req.body and pass to handler function. */
const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(req, res, 400, error.name, { errors });
    }
  };

/**
 * Generate access and refresh token and set cookies.
 *
 * @param {Request} _req Request.
 * @param {Response} res Response.
 * @param {string} uid _id.
 * @returns {object} Return pair of access and refresh token.
 */
const generateToken = (
  req: Request,
  res: Response,
  uid: Types.ObjectId
): void => {
  const token = jwt.sign({ uid }, env.TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: parseInt(env.TOKEN_EXPIRY),
  });

  res.cookie("jwt", token, {
    maxAge: parseInt(env.TOKEN_EXPIRY) * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV !== "development",
  });

  req.session.token = token;
};

export { generateHash, compareHash, validateSchema, generateToken };
