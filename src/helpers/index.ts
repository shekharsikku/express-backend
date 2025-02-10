import { UserInterface } from "../interface";
import { Response } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import env from "../utils/env";

const generateAccess = (res: Response, uid: Types.ObjectId) => {
  const accessExpiry = env.ACCESS_EXPIRY;

  const accessToken = jwt.sign({ uid }, env.ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: accessExpiry,
  });

  res.cookie("access", accessToken, {
    maxAge: accessExpiry * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return accessToken;
};

const generateRefresh = (res: Response, uid: Types.ObjectId) => {
  const refreshExpiry = env.REFRESH_EXPIRY;

  const refreshToken = jwt.sign({ uid }, env.REFRESH_SECRET, {
    algorithm: "HS512",
    expiresIn: refreshExpiry,
  });

  res.cookie("refresh", refreshToken, {
    maxAge: refreshExpiry * 1000 * 2,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return refreshToken;
};

const authorizeCookie = (res: Response, authId: string) => {
  const authExpiry = env.REFRESH_EXPIRY;

  res.cookie("session", authId, {
    maxAge: authExpiry * 1000 * 2,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined || value === null
  );
};

const createUserInfo = (user: UserInterface) => {
  let userInfo;

  if (user.setup) {
    userInfo = {
      ...user.toObject(),
      password: undefined,
      authentication: undefined,
    };
  } else {
    userInfo = {
      _id: user._id,
      email: user.email,
      setup: user.setup,
    };
  }

  return userInfo as UserInterface;
};

/*
const removeSpaces = (str: string) => {
  return str.replace(/\s+/g, "");
};

const capitalizeWord = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => capitalizeWord(word))
    .join(" ");
};

const generateSecureCode = (length = 6) => {
  const digits = "0123456789";
  const code = Array.from(crypto.randomBytes(length))
    .map((byte) => digits[byte % digits.length])
    .join("");
  return code;
};
*/

export {
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  createUserInfo,
};
