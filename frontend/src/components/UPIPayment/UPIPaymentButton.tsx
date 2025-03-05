import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Error,
  HourglassBottom,
  Payment,
} from "@mui/icons-material";

import { generateTransactionId, generateUPILink } from "@/utils/upiHelpers";
import UPIPaymentModal from "./UPIPaymentModal";

interface UPIPaymentButtonProps {
  amount: number;
  smartBalanceAmount?: number;
  smartBalanceMode: boolean;
  recipientName: string;
  recipientId: string;
  groupId: string;
  currentUserId: string;
  expenseId?: string;
  onPaymentComplete: () => void;
  disabled?: boolean;
}

const UPIPaymentButton: React.FC<UPIPaymentButtonProps> = ({
  amount,
  smartBalanceAmount,
  smartBalanceMode,
  recipientName,
  recipientId,
  groupId,
  currentUserId,
  expenseId,
  onPaymentComplete,
  disabled = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recipientUpiId, setRecipientUpiId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "initial" | "pending" | "completed" | "rejected"
  >("initial");

  const payableAmount = smartBalanceMode ? smartBalanceAmount || 0 : amount;

  // Disable button only if payment is completed or if the payable amount is invalid
  const isButtonDisabled = payableAmount <= 0 || paymentStatus === "completed";

  // Fetch recipient's UPI ID
  useEffect(() => {
    const fetchRecipientUpiId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${recipientId}/upiId`
        );
        setRecipientUpiId(response.data.upiId);
      } catch (error) {
        console.error("Error fetching recipient UPI ID:", error);
      }
    };

    fetchRecipientUpiId();
  }, [recipientId]);

  // Fetch the initial payment status when the component mounts
  useEffect(() => {
    console.log({ expenseId, currentUserId });
    const fetchPaymentStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-status`,
          {
            params: {
              expenseId,
              payerId: currentUserId,
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setPaymentStatus(response.data.status);
        }
      } catch (error) {
        console.error("Error fetching payment status:", error);
      }
    };

    if (expenseId && currentUserId) {
      fetchPaymentStatus();
    }
  }, [expenseId, currentUserId]);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  const handlePaymentConfirmation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-completed-by-ower`,
        {
          expenseId: expenseId,
          payerId: currentUserId,
          amount: payableAmount,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setPaymentStatus("completed");
        toast.success(`Payment notification sent to ${recipientName}`);
        onPaymentComplete();
      } else {
        toast.error("Failed to record payment completion");
        setPaymentStatus("rejected");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("An error occurred while recording payment");
      setPaymentStatus("rejected");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!recipientUpiId) {
      toast.error("Recipient UPI ID not available");
      return;
    }

    const transactionId = generateTransactionId(
      groupId,
      currentUserId,
      recipientId
    );
    const upiLink = generateUPILink(
      recipientUpiId,
      payableAmount,
      recipientName,
      transactionId
    );

    setPaymentStatus("pending");
    window.location.href = upiLink; // Redirect to UPI app
  };

  // Generate UPI payment link
  const upiPaymentLink = recipientUpiId
    ? generateUPILink(
        recipientUpiId,
        payableAmount,
        recipientName,
        generateTransactionId(groupId, currentUserId, recipientId)
      )
    : "";

  return (
    <>
      {paymentStatus === "pending" ? (
        <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <HourglassBottom className="text-yellow-600" fontSize="small" />
          <span className="text-yellow-700 text-sm font-medium">
            Awaiting Confirmation
          </span>
        </div>
      ) : paymentStatus === "completed" ? (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="text-green-600" fontSize="small" />
          <span className="text-green-700 text-sm font-medium">
            Payment Completed
          </span>
        </div>
      ) : paymentStatus === "rejected" ? (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Error className="text-red-600" fontSize="small" />
          <span className="text-red-700 text-sm font-medium">
            Payment Rejected
          </span>
        </div>
      ) : (
        <button
          onClick={handleOpenDialog}
          disabled={isButtonDisabled || disabled}
          className={`
              flex items-center justify-center 
              min-w-[140px] 
              px-4 py-2 
              rounded-lg 
              transition-all duration-200 
              space-x-2
              ${
                isButtonDisabled || disabled
                  ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
              }
            `}
        >
          <Payment fontSize="small" />
          <span className="font-medium">Pay via UPI</span>
        </button>
      )}

      <UPIPaymentModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        amount={payableAmount}
        recipientName={recipientName}
        recipientUpiId={recipientUpiId}
        upiPaymentLink={upiPaymentLink}
        paymentStatus={paymentStatus}
        isLoading={isLoading}
        onPayNow={handlePayNow}
        onPaymentConfirmation={handlePaymentConfirmation}
      />
    </>
  );
};

export default UPIPaymentButton;
