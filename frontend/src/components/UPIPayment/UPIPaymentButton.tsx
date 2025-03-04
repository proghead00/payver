import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
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
    "initial" | "pending" | "completed" | "failed"
  >("initial");

  // Calculate payable amount based on Smart Mode
  const payableAmount = smartBalanceMode
    ? smartBalanceAmount || 0 // Fallback to 0 if smartBalanceAmount is undefined
    : amount;

  // Disable button if payment is completed or if payable amount is invalid
  const isButtonDisabled =
    disabled || payableAmount <= 0 || paymentStatus === "completed";

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

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  const handlePaymentConfirmation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-completed`,
        {
          expenseId: expenseId,
          userId: recipientId,
          payerId: currentUserId,
          amount: payableAmount,
          smartBalanceMode,
        }
      );

      if (response.data.success) {
        setPaymentStatus("completed");
        toast.success(`Payment notification sent to ${recipientName}`);
        onPaymentComplete();
      } else {
        toast.error("Failed to record payment completion");
        setPaymentStatus("failed");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("An error occurred while recording payment");
      setPaymentStatus("failed");
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
      <button
        onClick={handleOpenDialog}
        disabled={isButtonDisabled}
        className={`bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg border border-blue-200 ${
          isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <img src="/upiLogo.svg" alt="UPI Logo" className="w-6 h-6" />
        <span className="font-medium">Pay via UPI</span>
      </button>

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
