import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { extractErrorMessage } from "@/utils/errorHandler";
import { CheckCircle, Cancel, NotificationsNone } from "@mui/icons-material"; // Added NotificationsNone icon

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/notifications/${currentUserId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Filter out notifications with null groupId and match the group._id
        const groupNotifications = response.data.notifications.filter(
          (notif: Notification) =>
            notif.groupId && notif.groupId._id === group._id
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-confirmed-by-receiver`,
        {
          notificationId: notificationId, // Send notificationId instead of expenseId and payerId
          status: "completed",
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove the confirmed notification
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );

        // Refresh group data and balances
        await fetchGroupData();
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-confirmed-by-receiver`,
        {
          notificationId: notificationId, // Send notificationId instead of expenseId and payerId
          status: "rejected",
        },
        { withCredentials: true }
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
            <NotificationsNone style={{ fontSize: 64 }} />{" "}
            {/* Replaced SVG with MUI icon */}
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
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold">
                      {notification.payerId.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">
                      <span className="text-blue-600">
                        {notification?.payerId.name}
                      </span>{" "}
                      has marked a payment as completed
                    </p>
                    <p className="text-sm text-gray-500">
                      For expense: {notification?.expenseId?.description}
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
