import mongoose, { Document, Schema, Types } from "mongoose";

interface ISplit {
  user: mongoose.Types.ObjectId; // who owes money
  amount: number; // how much they owe
  paid: boolean; // whether the user has paid their share (confirmed by recipient)
  paymentCompleted?: boolean; // whether the user has marked as paid (pending recipient confirmation)
}

interface IExpense extends Document {
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId; // who paid the amount
  group: mongoose.Types.ObjectId;
  splitDetails: ISplit[]; // array storing who owes whom
  createdBy: Types.ObjectId;
}

const ExpenseSchema = new mongoose.Schema(
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
        paid: { type: Boolean, default: false }, // Confirmed by recipient
        paymentCompleted: { type: Boolean, default: false }, // Marked by payer as "I've completed the payment"
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
