import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle,
  Cancel,
  ArrowForward,
  QrCodeScanner,
} from "@mui/icons-material";
import { formatAmount } from "@/utils/upiHelpers";

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  recipientName: string;
  recipientUpiId: string;
  upiPaymentLink: string;
  paymentStatus: "initial" | "pending" | "completed" | "rejected";
  isLoading: boolean;
  onPayNow: () => void;
  onPaymentConfirmation: () => void;
}

const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  recipientName,
  recipientUpiId,
  upiPaymentLink,
  paymentStatus,
  isLoading,
  onPayNow,
  onPaymentConfirmation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-600">Pay ₹{formatAmount(amount)}</span>
          <ArrowForward className="text-gray-500" fontSize="small" />
          <span className="text-gray-800">{recipientName}</span>
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : paymentStatus === "initial" || paymentStatus === "rejected" ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              You're about to pay ₹
              <span className="font-bold text-blue-600">
                {formatAmount(amount)}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-800">{recipientName}</span>.
            </p>

            {recipientUpiId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-700">Recipient UPI ID:</p>
                <p className="text-blue-600 font-mono">{recipientUpiId}</p>
              </div>
            )}

            {/* QR Code for UPI Payment */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <QRCodeSVG
                  value={upiPaymentLink}
                  size={200}
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <QrCodeScanner className="text-gray-500" fontSize="small" />
                Scan the QR code to pay via UPI.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md flex items-center gap-2"
              >
                Cancel
              </button>
              <button
                onClick={onPayNow}
                disabled={!recipientUpiId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
              >
                Pay Now
              </button>
            </div>
          </div>
        ) : paymentStatus === "pending" ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Please complete the payment in your UPI app.
            </p>
            <button
              onClick={onPaymentConfirmation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle fontSize="small" />
                  <span>I've Completed the Payment</span>
                </>
              )}
            </button>
          </div>
        ) : paymentStatus === "completed" ? (
          <div className="text-center">
            <CheckCircle className="text-green-600 mx-auto" fontSize="large" />
            <p className="text-green-600 font-bold mt-2">Payment Successful!</p>
            <p className="text-gray-600">
              You've paid ₹{formatAmount(amount)} to {recipientName}.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UPIPaymentModal;
