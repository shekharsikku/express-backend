import { Document, Schema, Types, model } from "mongoose";

interface UserInterface extends Document {
  _id: Types.ObjectId;
  fullname: string;
  username: string;
  email: string;
  password: string;
  refreshtoken?: string;
}

/**
 * UserSchema for define UserModel.
 *
 * @types {UserInterface}
 *
 * @property {string} fullname - The user's fullname.
 * @property {string} username - The user's username.
 * @property {string} email - The user's email.
 * @property {string} password - The user's password.
 * @property {string} refreshtoken - The user's refreshtoken.
 */
const UserSchema = new Schema<UserInterface>(
  {
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshtoken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export { UserInterface, UserSchema };

const User = model<UserInterface>("User", UserSchema);

export default User;
