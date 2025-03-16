import React, { useState } from "react";
import { Group } from "../../config/types";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import axios from "axios";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/errorHandler";

interface BalanceCardProps {
  title: string;
  balances: any[];
  group: Group;
  currentUserId: string;
  smartBalanceMode: boolean;
  type: "receive" | "pay" | "all";
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  balances,
  group,
  currentUserId,
  smartBalanceMode,
  type,
}) => {
  const { dispatch } = useGroupContext();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<{
    userId: string;
    amount: number;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { fetchGroupData } = useGroupContext();

  const handleMarkAsPaid = async (userId: string, amount: number) => {
    setIsConfirming(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-confirmed-by-receiver-via-mark-as-paid`,
        {
          userId,
          amount,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      if (response.data.success) {
        dispatch({
          type: ActionTypes.MARK_AS_PAID,
          payload: { userId, amount },
        });
      }

      await fetchGroupData();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      toast.error(extractErrorMessage(error) || "Failed to update expense");
    } finally {
      setIsConfirming(false);
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div
        className={`${
          type === "receive"
            ? "bg-green-50"
            : type === "pay"
            ? "bg-blue-50"
            : "bg-gray-50"
        } px-4 py-3 border-b border-gray-200`}
      >
        <h4 className="font-medium text-gray-800">{title}</h4>
      </div>
      <div className="divide-y divide-gray-100">
        {balances.length > 0 ? (
          balances.map((balance, index) => {
            const fromUser = group.members.find((m) => m._id === balance.from);
            const toUser = group.members.find((m) => m._id === balance.to);

            if (!fromUser || !toUser) return null;

            // Check if the current user is the receiver of the payment
            const isReceiver = balance.from === currentUserId;
            return (
              <div
                key={`${type}-${index}`}
                className="p-4 flex justify-between items-center"
              >
                <div className="flex items-center">
                  <span className="font-medium">
                    {type === "receive" ? fromUser.name : toUser.name}
                  </span>
                  {smartBalanceMode && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      Smart
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-800 font-medium">
                    ₹{balance.amount.toFixed(2)}
                  </span>

                  {type === "receive" && (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200"
                      onClick={() => {
                        setSelectedBalance({
                          userId: balance.from,
                          amount: balance.amount,
                        });
                        setIsConfirmModalOpen(true);
                      }}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500">
            {type === "receive"
              ? "No one needs to pay you anything"
              : type === "pay"
              ? "You are all settled up!"
              : "Everyone is settled up! No balances due."}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (selectedBalance) {
            handleMarkAsPaid(selectedBalance.userId, selectedBalance.amount);
          }
        }}
        title="Confirm Payment"
        message={
          <>
            <p className="mb-2">
              You have two options to confirm this payment:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>
                <strong>Mark as Paid:</strong> Manually mark this payment as
                paid if you've received the amount outside the app.
              </li>
              <li>
                <strong>Payment via UPI:</strong> Ask the payer to confirm the
                payment via UPI. Once confirmed, you'll receive a notification
                to approve the payment.
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              Note: Marking as paid will settle the payment immediately for
              debts that are <strong>NOT</strong> paid via UPI. If you're
              unsure, ask the payer to confirm via UPI.
            </p>
          </>
        }
        confirmButtonText="Mark as Paid"
        isConfirming={isConfirming}
        variant="confirm"
      />
    </div>
  );
};

export default BalanceCard;
