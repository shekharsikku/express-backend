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
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
  }[];
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface FriendInterface extends Document {
  _id?: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "canceled" | "blocked";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationInterface extends Document {
  _id?: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  interaction: Date;
}

interface MessageInterface extends Document {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  type: "default" | "edited" | "deleted";
  content: {
    type: "text" | "file";
    text?: string;
    file?: string;
  };
  deletedAt: Date;
}
