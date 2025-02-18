import mongoose, { Document } from "mongoose";

interface IExpense extends Document {
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
}

const ExpenseSchema = new mongoose.Schema<IExpense>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
