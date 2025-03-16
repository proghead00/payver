import mongoose, { Document, Schema, Types } from "mongoose";

interface ISplit {
  user: Types.ObjectId;
  amount: number; // Amount owed by the user
  completedPaymentByOwer?: boolean; // Whether the payment is marked as completed by the payer
  paymentConfirmedByReceiver?: boolean; // Whether the payment is confirmed by the receiver
}

interface IEditHistory {
  editedBy?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
  timestamp?: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
}

interface IPaidByUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}
interface IExpense extends Document {
  description: string;
  amount: number;
  paidBy: IPaidByUser;
  group: Types.ObjectId;
  splitDetails: ISplit[];
  createdBy: Types.ObjectId;
  smartBalanceMode: boolean;
  editHistory: IEditHistory[];
}

const ExpenseSchema = new mongoose.Schema(
  {
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
          },
          name: {
            type: String,
          },
          email: {
            type: String,
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
            },
            oldValue: {
              type: Schema.Types.Mixed,
            },
            newValue: {
              type: Schema.Types.Mixed,
            },
          },
        ],
        reason: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", ExpenseSchema);
