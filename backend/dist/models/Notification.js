import mongoose, { Schema } from "mongoose";
const NotificationSchema = new Schema({
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
    isSmartBalancePayment: { type: Boolean, default: null },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
export default mongoose.model("Notification", NotificationSchema);
