import { Types, Document } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female" | "Other";
  image?: string;
  bio?: string;
  setup?: boolean;
  friends: Types.ObjectId[];
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
    device?: string;
  }[];
}

interface RequestsInterface extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "retrieved";
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface DetailInterface {
  name?: string;
  username?: string;
  gender?: "Male" | "Female" | "Other";
  bio?: string;
  setup?: boolean;
}
