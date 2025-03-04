import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { extractErrorMessage } from "@/utils/errorHandler";
import { formatAmount } from "@/utils/upiHelpers";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Cancel } from "@mui/icons-material";

interface Notification {
  _id: string;
  type: string;
  expenseId: {
    _id: string;
    description: string;
    amount: number;
  };
  groupId: {
    _id: string;
    name: string;
  };
  payerId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  recipientId: string;
  amount: number;
  status: string;
  timestamp: string;
}

const Notifications: React.FC = () => {
  const { currentUserId, group, fetchGroupData } = useGroupContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUserId || !group) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/notifications/${currentUserId}`
      );

      if (response.data.success) {
        const groupNotifications = response.data.notifications.filter(
          (notif: Notification) => notif.groupId._id === group._id
        );
        setNotifications(groupNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm payment
  const handleConfirmPayment = async (notificationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/confirm-payment`,
        {
          notificationId,
          status: "confirmed",
          balanceMode: "smart", // Always use smart mode for confirmation
        }
      );

      if (response.data.success) {
        // Remove the confirmed notification
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );

        // Refresh group data and balances
        await fetchGroupData();

        // Fetch updated balances
        const balancesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expense/balances/${group?._id}`
        );

        if (balancesResponse.data.success) {
          console.log("Updated Balances:", balancesResponse.data);
        }
      }
    } catch (error) {
      extractErrorMessage(error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Reject payment
  const handleRejectPayment = async (notificationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/confirm-payment`,
        {
          notificationId,
          status: "rejected",
        }
      );

      if (response.data.success) {
        // Remove the rejected notification
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
      }
    } catch (error) {
      extractErrorMessage(error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUserId, group]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Payments</h3>
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700">
            No pending payments
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {notification.payerId.avatar ? (
                      <img
                        src={notification.payerId.avatar}
                        alt={notification.payerId.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold">
                        {notification.payerId.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      <span className="text-blue-600">
                        {notification.payerId.name}
                      </span>{" "}
                      has marked a payment as completed
                    </p>
                    <p className="text-sm text-gray-500">
                      For expense: {notification.expenseId.description}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{notification.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConfirmPayment(notification._id)}
                    disabled={processingIds.has(notification._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md flex items-center transition-colors disabled:opacity-50"
                  >
                    {processingIds.has(notification._id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle fontSize="small" className="mr-1" />
                        <span>Confirm</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectPayment(notification._id)}
                    disabled={processingIds.has(notification._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md flex items-center transition-colors disabled:opacity-50"
                  >
                    {processingIds.has(notification._id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Cancel fontSize="small" className="mr-1" />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
