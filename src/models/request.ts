import { Schema, model } from "mongoose";
import { RequestsInterface } from "../interface";

const RequestsSchema = new Schema<RequestsInterface>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Requests = model<RequestsInterface>("Request", RequestsSchema);

export default Requests;
