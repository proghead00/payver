import mongoose, { Document } from "mongoose";

interface ISplit {
  user: mongoose.Types.ObjectId; // who owes money
  amount: number; // how much they owe
}

interface IExpense extends Document {
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId; // who paid the amount
  group: mongoose.Types.ObjectId;
  splitDetails: ISplit[]; // array storing who owes whom
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
    splitDetails: [
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

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
