import mongoose, { Schema } from "mongoose";
const ExpenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
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
            amount: {
                type: Number,
                required: true,
            },
            completedPaymentByOwer: {
                type: Boolean,
                default: null,
            },
            paymentConfirmedByReceiver: {
                type: Boolean,
                default: null,
            },
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    smartBalanceMode: {
        type: Boolean,
        default: false,
    },
    editHistory: [
        {
            editedBy: {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                email: {
                    type: String,
                    required: true,
                },
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            changes: [
                {
                    field: {
                        type: String,
                        required: true,
                    },
                    oldValue: {
                        type: Schema.Types.Mixed,
                        required: true,
                    },
                    newValue: {
                        type: Schema.Types.Mixed,
                        required: true,
                    },
                },
            ],
            reason: {
                type: String,
            },
        },
    ],
}, { timestamps: true });
export default mongoose.model("Expense", ExpenseSchema);
