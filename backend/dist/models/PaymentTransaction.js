// models/PaymentTransaction.ts
import mongoose from "mongoose";
const paymentTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },
    method: {
        type: String,
        enum: ["UPI", "cash", "other"],
        default: "UPI",
    },
    verificationDetails: {
        type: Object,
        default: null,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction;
