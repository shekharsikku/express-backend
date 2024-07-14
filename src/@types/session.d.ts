import { Types } from "mongoose";

declare module "express-session" {
  interface SessionData {
    user?: Types.ObjectId;
    token?: string;
  }
}
