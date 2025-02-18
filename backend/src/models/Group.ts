import mongoose, { Document } from "mongoose";
interface IGroup extends Document {
  name: string;
  picture?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  expenses: mongoose.Types.ObjectId[];
}

const GroupSchema = new mongoose.Schema<IGroup>(
  {
    name: { type: String, required: true },
    picture: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
