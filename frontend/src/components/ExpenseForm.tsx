import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import { Group, User } from "../config/types";

interface ExpenseFormProps {
  initialData: {
    description: string;
    amount: number;
    paidBy: string;
    splitDetails: Array<{
      user: string | { _id: string };
      amount: number;
    }>;
    splitMethod?: string;
  };
  group?: Group | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  currentUserId: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  group,
  onSubmit,
  onCancel,
  currentUserId,
}) => {
  const [description, setDescription] = useState(initialData.description);
  const [amount, setAmount] = useState(initialData.amount);
  const [paidBy, setPaidBy] = useState(initialData.paidBy || currentUserId);
  const [splitMethod, setSplitMethod] = useState(
    initialData.splitMethod || "equal"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!group) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    try {
      // Calculate equal split amount
      const participantCount = group?.members.length;
      const splitAmount = parseFloat((amount / participantCount).toFixed(2));

      // Create split details with equal amounts
      const splitDetails = group.members.map((member) => ({
        user: member._id,
        amount: member._id === paidBy ? 0 : splitAmount, // Payer doesn't owe themselves
      }));

      const expenseData = {
        description,
        amount,
        paidBy,
        group: group._id,
        splitDetails,
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/create`,
        expenseData,
        { withCredentials: true }
      );

      toast.success("Expense added successfully");
      await onSubmit(expenseData);
      onCancel();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to add expense");
      console.error("Error adding expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return <div>Loading...</div>;
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount (₹)
        </label>
        <input
          type="number"
          id="amount"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="paidBy"
          className="block text-sm font-medium text-gray-700"
        >
          Paid By
        </label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        >
          {group.members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name} {member._id === currentUserId ? "(You)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Split Method
        </label>
        <div className="mt-1">
          <div className="flex items-center">
            <input
              id="equal"
              name="splitMethod"
              type="radio"
              value="equal"
              checked={splitMethod === "equal"}
              onChange={() => setSplitMethod("equal")}
              className="h-4 w-4 text-blue-600 border-gray-300"
            />
            <label htmlFor="equal" className="ml-2 block text-sm text-gray-700">
              Equal Split (Split equally among all members)
            </label>
          </div>
        </div>
      </div>

      {splitMethod === "equal" && (
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Equal Split Summary:</strong> Each member will pay ₹
            {(amount / group.members.length).toFixed(2)}
            {paidBy === currentUserId
              ? ". You are paying for everyone."
              : `. Paid by ${
                  group.members.find((m) => m._id === paidBy)?.name || "Unknown"
                }.`}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Expense"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
