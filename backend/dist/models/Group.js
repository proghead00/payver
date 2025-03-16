import mongoose from "mongoose";
const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    picture: { type: String, default: null },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
    balances: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            amount: { type: Number, required: true },
        },
    ],
    smartMode: { type: Boolean, default: false },
    smartBalances: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            amount: { type: Number, required: true },
        },
    ],
}, { timestamps: true });
export default mongoose.model("Group", GroupSchema);
