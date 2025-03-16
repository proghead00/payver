import LoadingSpinner from "@/components/Common/LoadingSpinner";
import { Group } from "@/config/types";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { extractErrorMessage } from "@/utils/errorHandler";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ExpenseFormProps {
  initialData: {
    description: string;
    amount: number;
    paidBy: string | { _id: string; name: string };
    splitDetails: Array<{
      user: string | { _id: string; name: string };
      amount: number;
    }>;
    splitMethod?: string;
  };
  group?: Group | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  currentUserId: string;
  isEditing?: boolean; // Add this prop to distinguish between add and edit
  expenseId?: string; // Add expenseId to the props
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  group,
  onSubmit,
  onCancel,
  currentUserId,
  isEditing = false,
  expenseId,
}) => {
  const [description, setDescription] = useState(initialData.description);
  const [amount, setAmount] = useState(initialData.amount || "");
  const [paidBy, setPaidBy] = useState<{ _id: string; name: string }>(
    typeof initialData.paidBy === "string"
      ? { _id: initialData.paidBy, name: "" }
      : initialData.paidBy || { _id: currentUserId, name: "" }
  );
  const [splitMethod, setSplitMethod] = useState(
    initialData.splitMethod || "equal"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setDescription(initialData.description);
    setAmount(initialData.amount || "");
    setPaidBy(
      typeof initialData.paidBy === "string"
        ? { _id: initialData.paidBy, name: "" }
        : initialData.paidBy || { _id: currentUserId, name: "" }
    );
    setSplitMethod(initialData.splitMethod || "equal");
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!group) {
      toast.error("Group not found");
      return;
    }

    try {
      const participantCount = group.members.length;
      const splitAmount = parseFloat(
        (Number(amount) / participantCount).toFixed(2)
      );

      const splitDetails = group.members.map((member) => ({
        user: { _id: member._id, name: member.name },
        amount: member._id === paidBy._id ? 0 : splitAmount,
      }));

      const expenseData = {
        description,
        amount: Number(amount),
        paidBy: { _id: paidBy._id, name: paidBy.name },
        splitDetails,
        reason: isEditing ? reason : undefined,
      };

      await onSubmit(expenseData);

      onCancel();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to update expense");
      console.error("Error updating expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return <LoadingSpinner />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description Field */}
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

      {/* Amount Field */}
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
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue === "") {
              setAmount("");
            } else {
              setAmount(parseFloat(newValue) || 0);
            }
          }}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      {/* Paid By Field */}
      <div>
        <label
          htmlFor="paidBy"
          className="block text-sm font-medium text-gray-700"
        >
          Paid By
        </label>
        <select
          id="paidBy"
          value={paidBy._id}
          onChange={(e) => {
            const selectedMember = group.members.find(
              (member) => member._id === e.target.value
            );
            if (selectedMember) {
              setPaidBy({ _id: selectedMember._id, name: selectedMember.name });
            }
          }}
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

      {/* Split Method Field */}
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

      {/* Equal Split Summary */}
      {splitMethod === "equal" && (
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Equal Split Summary:</strong> Each member will pay ₹
            {(Number(amount) / group.members.length).toFixed(2)}
            {paidBy._id === currentUserId
              ? ". You are paying for everyone."
              : `. Paid by ${paidBy.name}.`}
          </p>
        </div>
      )}

      {/* Reason Field (Only for Editing) */}
      {isEditing && (
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700"
          >
            Reason for Edit
          </label>
          <input
            type="text"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
      )}

      {/* Form Buttons */}
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
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Adding..."
            : isEditing
            ? "Update Expense"
            : "Add Expense"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
