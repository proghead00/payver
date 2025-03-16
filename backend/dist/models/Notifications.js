import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema({
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
}, { timestamps: true });
export default mongoose.model("Notification", NotificationSchema);
