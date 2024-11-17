import { Types, Schema, model } from "mongoose";
import { UserInterface } from "../interface";

const UserSchema = new Schema<UserInterface>(
  {
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    setup: {
      type: Boolean,
      default: false,
    },
    authentication: {
      type: [
        {
          token: String,
          expiry: Date,
          device: {
            type: String,
            default: null,
          },
        },
      ],
      select: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Date,
      default: Date.now,
    },
    verification: {
      code: { type: String },
      expiry: { type: Date },
    },
    reset: {
      code: { type: String },
      expiry: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (!this.username || this.username.trim() === "") {
    this.username = new Types.ObjectId().toString();
  }
  next();
});

const User = model<UserInterface>("User", UserSchema);

export default User;
