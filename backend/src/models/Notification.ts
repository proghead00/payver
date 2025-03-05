import mongoose, { Document, Schema } from "mongoose";

interface INotification extends Document {
  type: string; // e.g., 'payment_pending'
  expenseId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  amount: number;
  status: string; // 'pending', 'completed', 'rejected'
  timestamp: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true },
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    payerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
