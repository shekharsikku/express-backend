import { Types, Document } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female";
  image?: string;
  bio?: string;
  setup?: boolean;
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
    device?: string;
  }[];
  verified?: boolean;
  active?: Date;
  verification?: {
    code: string;
    expiry: Date;
  };
  reset?: {
    code: string;
    expiry: Date;
  };
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}
