import mongoose, { Document } from "mongoose";

interface IBalance {
  user: mongoose.Types.ObjectId;
  amount: number;
}

interface IGroup extends Document {
  name: string;
  picture?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  expenses: mongoose.Types.ObjectId[];
  actualBalances: IBalance[]; // tracks who owes whom
  smartBalances: IBalance[]; // tracks net balances after smart balance logic
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
    actualBalances: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: { type: Number, required: true },
      },
    ],
    smartBalances: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
