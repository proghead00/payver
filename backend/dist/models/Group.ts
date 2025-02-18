import mongoose, { Schema, Document, Types } from "mongoose";

interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  picture?: string | null;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  expenses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    picture: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }],
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt`
);

export default mongoose.model<IGroup>("Group", GroupSchema);
