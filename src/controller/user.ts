import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils";
import {
  authorizeCookie,
  compareHash,
  createAccessData,
  generateAccess,
  generateHash,
  generateRefresh,
  generateSecureCode,
  maskedDetails,
} from "../helper";
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../config/email";
import User from "../model/user";
import env from "../utils/env";

/** Code expiration time which long is 24 and short is 1 hour */
const longExpirationTime = 24 * 60 * 60 * 1000;
const shortExpirationTime = 60 * 60 * 1000;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;

    const existedUser = await User.findOne({ email });

    const hashedPassword = await generateHash(password);
    const verificationCode = generateSecureCode();
    const verificationExpiry = Date.now() + longExpirationTime;

    if (existedUser) {
      /** If user existed and verified */
      if (existedUser.verified) {
        throw new ApiError(409, "Email already exists!");
      }

      /** Update existing info if not verified */
      const updateResult = await User.updateOne(
        { _id: existedUser._id, email: email },
        {
          password: hashedPassword,
          $set: {
            "verification.code": verificationCode,
            "verification.expiry": verificationExpiry,
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        /** Send verification email */
        const emailResponse = await sendVerificationEmail(
          email,
          verificationCode
        );

        if (emailResponse) {
          const userData = maskedDetails(existedUser);
          return ApiResponse(res, 200, "Please, verify your email!", userData);
        }
      }

      throw new ApiError(500, "Error while registering user!");
    }

    /** If user not existed then create new one */
    const newUser = await User.create({
      email,
      password: hashedPassword,
      verification: {
        code: verificationCode,
        expiry: verificationExpiry,
      },
    });

    /** Send verification email */
    const emailResponse = await sendVerificationEmail(email, verificationCode);

    if (emailResponse) {
      const userData = maskedDetails(newUser);
      return ApiResponse(res, 201, "Please, verify your email!", userData);
    }

    throw new ApiError(500, "Error while registering user!");
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { code, email } = await req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found!");
    }

    if (user.verified) {
      throw new ApiError(409, "Email is already verified!");
    }

    if (
      user.verification &&
      user.verification.code === code &&
      user.verification.expiry.getTime() > Date.now()
    ) {
      user.verified = true;
      user.verification = undefined;
      await user.save();

      /** Send welcome email */
      const emailResponse = await sendWelcomeEmail(user.email);

      if (emailResponse) {
        const userData = maskedDetails(user);
        return ApiResponse(res, 202, "Email verified successfully!", userData);
      }

      throw new ApiError(500, "Error while sending welcome email!");
    } else if (
      user.verification &&
      user.verification.code === code &&
      user.verification.expiry.getTime() <= Date.now()
    ) {
      const verificationCode = generateSecureCode();
      const verificationExpiry = Date.now() + shortExpirationTime;

      user.verification = {
        code: verificationCode,
        expiry: new Date(verificationExpiry),
      };
      await user.save();

      /** Resend verification email */
      const emailResponse = await sendVerificationEmail(
        user.email,
        verificationCode
      );

      if (emailResponse) {
        return ApiResponse(
          res,
          200,
          "Verification code has expired. A new code has been sent to your email!"
        );
      }

      throw new ApiError(500, "Error while resending verification email!");
    }

    throw new ApiError(403, "Invalid verification code!");
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = await req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found!");
    }

    /** If user is not verified then don't allow reset */
    if (!user.verified) {
      throw new ApiError(
        403,
        "Please verify your email before requesting a password reset!"
      );
    }

    const resetCode = generateSecureCode();
    const expiryTime = Date.now() + shortExpirationTime;

    user.reset = {
      code: resetCode,
      expiry: new Date(expiryTime),
    };
    await user.save();

    const emailResponse = await sendPasswordResetEmail(user.email, resetCode);

    if (emailResponse) {
      return ApiResponse(res, 200, "Password reset email sent successfully!");
    }
    throw new ApiError(500, "Error while sending password reset email!");
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, password } = await req.body;

    const user = await User.findOne({ email }).lean();

    if (!user) {
      throw new ApiError(404, "User not found!");
    }

    if (!user.reset) {
      throw new ApiError(400, "No reset request found for this user!");
    }

    const { code: storedCode, expiry: storedExpiry } = user.reset;

    if (storedCode !== code) {
      throw new ApiError(400, "Invalid reset code!");
    }

    if (storedExpiry.getTime() < Date.now()) {
      throw new ApiError(400, "Expired reset code!");
    }

    const hashedPassword = await generateHash(password);

    const updatedData = await User.updateOne(
      { _id: user._id, email: email },
      {
        password: hashedPassword,
        $unset: { reset: "" },
      },
      { new: true }
    );

    if (updatedData.modifiedCount > 0) {
      const emailResponse = await sendResetSuccessEmail(email);

      if (emailResponse) {
        return ApiResponse(res, 200, "Password reset successfully!");
      }
    }

    throw new ApiError(500, "Error while resetting password!");
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, device_info } = await req.body;
    const conditions = [];

    if (email) {
      conditions.push({ email });
    } else if (username) {
      conditions.push({ username });
    } else {
      throw new ApiError(400, "Email or Username required!");
    }

    const existsUser = await User.findOne({
      $or: conditions,
    }).select("+password +authentication");

    if (!existsUser) {
      throw new ApiError(404, "User not exists!");
    }

    if (!existsUser.verified) {
      const verificationCode = generateSecureCode();
      const verificationExpiry = Date.now() + shortExpirationTime;

      /** Update existing info if not verified */
      const updateResult = await User.updateOne(
        { _id: existsUser._id, email: existsUser.email },
        {
          $set: {
            "verification.code": verificationCode,
            "verification.expiry": verificationExpiry,
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        /** Send verification email */
        const emailResponse = await sendVerificationEmail(
          email,
          verificationCode
        );

        if (emailResponse) {
          const userData = maskedDetails(existsUser);
          return ApiResponse(res, 200, "Please, verify your email!", userData);
        }
      }
    }

    const validatePassword = await compareHash(password, existsUser.password!);

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect password!");
    }

    const accessData = createAccessData(existsUser);
    const accessToken = generateAccess(res, accessData);

    if (!accessData.setup) {
      const userData = maskedDetails(accessData);
      return ApiResponse(res, 200, "Please, complete your profile!", userData);
    }

    const refreshToken = generateRefresh(res, accessData._id!);
    const refreshExpiry = parseInt(env.REFRESH_EXPIRY!);

    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
      device: device_info,
    });

    const authorizeUser = await existsUser.save();

    const authorizeId = authorizeUser.authentication?.filter(
      (auth) => auth.token === refreshToken
    )[0]._id!;

    authorizeCookie(res, String(authorizeId));

    return ApiResponse(res, 200, "login successfully!", {
      _id: accessData._id,
      email: accessData.email,
      setup: accessData.setup,
    });
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const requestUser = req.user!;
  const refreshToken = req.cookies.refresh;
  const authorizeId = req.cookies.auth_id;

  if (requestUser.setup && refreshToken && authorizeId) {
    await User.findByIdAndUpdate(
      { _id: requestUser._id },
      {
        active: Date.now,
        $pull: {
          authentication: { _id: authorizeId, token: refreshToken },
        },
      },
      { new: true }
    );
  }

  res.clearCookie("access");
  res.clearCookie("refresh");
  res.clearCookie("auth_id");
  return ApiResponse(res, 200, "Logged out successfully!");
};

export const refreshAuth = async (req: Request, res: Response) => {
  return ApiResponse(res, 200, "Authentication refreshed!", req.user);
};

export const userInformation = async (req: Request, res: Response) => {
  try {
    const requestUser = req.user!;

    if (requestUser?.setup) {
      return ApiResponse(res, 200, "User profile information!", requestUser);
    }
    const userData = maskedDetails(requestUser);
    return ApiResponse(res, 200, "Please, complete your profile!", userData);
  } catch (error: any) {
    console.error("Error:", error.message);

    return ApiResponse(
      res,
      error.code || 500,
      error.message || "Internal server error!"
    );
  }
};

// const tokenRefresh = async (req: Request, res: Response) => {
//   try {
//     const user = req.user;
//     const token = req.token;
//     return ApiResponse(req, res, 200, "Token refreshed successfully!", {
//       id: user?._id,
//       token,
//     });
//   } catch (error: any) {
//     return ApiResponse(req, res, error.code, error.message);
//   }
// };

// const changeCurrentPassword = async (req: Request, res: Response) => {
//   try {
//     const { old_password, new_password } = await req.body;

//     const user = await User.findById(req.user?._id).select("+password");

//     if (!user) {
//       throw new ApiError(400, "Invalid change request!");
//     }

//     const checked = await compareHash(old_password, user?.password!);

//     if (!checked) {
//       throw new ApiError(403, "Invalid old password!");
//     }

//     user.password = await generateHash(new_password);
//     await user.save({ validateBeforeSave: false });

//     return ApiResponse(req, res, 202, "Password changed successfully!");
//   } catch (error: any) {
//     return ApiResponse(req, res, error.code, error.message);
//   }
// };

// interface UpdateUserObject {
//   username?: string;
//   email?: string;
//   fullName?: string;
// }

// const updateUserDetails = async (req: Request, res: Response) => {
//   try {
//     const { fullName, email, username } = await req.body;

//     const existedUser = await User.findOne({
//       $or: [{ username }, { email }],
//     });

//     if (existedUser) {
//       let field;

//       if (existedUser.username == username) {
//         field = "Username";
//       } else {
//         field = "Email";
//       }
//       throw new ApiError(409, `${field} already exists!`);
//     }

//     const updateObject: UpdateUserObject = {};

//     if (username) updateObject.username = username;
//     if (email) updateObject.email = email;
//     if (fullName) updateObject.fullName = fullName;

//     const result = await User.updateOne(
//       { _id: req.user?._id },
//       { $set: updateObject }
//     );

//     if (result.modifiedCount === 1) {
//       return ApiResponse(req, res, 200, "Details updated successfully!");
//     }
//     throw new ApiError(500, "Details not updated!");
//   } catch (error: any) {
//     return ApiResponse(req, res, error.code, error.message);
//   }
// };

// const deleteUserDetails = async (req: Request, res: Response) => {
//   try {
//     const { current_password } = await req.body;

//     const user = await User.findById(req.user?._id).select("+password");

//     if (!user) {
//       throw new ApiError(400, "Invalid delete request!");
//     }

//     const checked = await compareHash(current_password, user.password);

//     if (checked) {
//       const deletedUser = await user.deleteOne();

//       if (deletedUser.deletedCount === 1) {
//         res.clearCookie("access");
//         res.clearCookie("refresh");
//         return ApiResponse(req, res, 301, "User details deleted successfully!");
//       }
//     }
//     throw new ApiError(403, "Invalid user password!");
//   } catch (error: any) {
//     return ApiResponse(req, res, error.code, error.message);
//   }
// };
