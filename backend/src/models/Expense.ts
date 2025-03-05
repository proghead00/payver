import mongoose, { Document, Schema, Types } from "mongoose";

interface ISplit {
  user: mongoose.Types.ObjectId; // who owes money
  amount: number; // how much they owe

  paymentCompleted?: boolean; // whether the user has marked as paid (pending recipient confirmation)
  completedPaymentByOwer?: boolean; // whether the user has marked as completed
  paymentConfirmedByReceiver?: boolean; // whether the recipient has confirmed the payment
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
        completedPaymentByOwer: { type: Boolean, default: false }, // Marked by payer as "I've completed the payment"
        paymentConfirmedByReceiver: { type: Boolean, default: false }, // Whether the recipient has confirmed the payment
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
