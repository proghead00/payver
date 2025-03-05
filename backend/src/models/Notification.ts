import mongoose, { Document, Schema } from "mongoose";

interface INotification extends Document {
  type: string; // 'payment_pending', 'expense_added', etc.
  expenseId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId; // Who made the payment
  recipientId: mongoose.Types.ObjectId; // Who should receive the payment
  amount: number;
  status: string; // 'pending', 'confirmed', 'rejected'
  timestamp: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    type: { type: String, required: true },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: "pending" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
