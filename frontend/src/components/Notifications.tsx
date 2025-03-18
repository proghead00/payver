import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGroupContext } from "@/context/GroupContext/GroupContext";
import { extractErrorMessage } from "@/utils/errorHandler";
import { CheckCircle, Cancel, NotificationsNone } from "@mui/icons-material";
import ConfirmationModal from "@/components/Common/ConfirmationModal";

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

  // State for modal management
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-confirmed-by-receiver-via-notification`,
        {
          notificationId: notificationId,
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
      setIsConfirmModalOpen(false);
    }
  };

  // Reject payment
  const handleRejectPayment = async (notificationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/payment-confirmed-by-receiver-via-notification`,
        {
          notificationId: notificationId,
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
      setIsRejectModalOpen(false);
    }
  };

  const openConfirmModal = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setIsConfirmModalOpen(true);
  };

  const openRejectModal = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setIsRejectModalOpen(true);
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUserId, group]);

  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        Your notifications
      </h3>
      {isLoading ? (
        <div className="flex justify-center my-4 sm:my-8">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-4 sm:py-8">
          <div className="text-gray-400 mb-3 sm:mb-4">
            <NotificationsNone style={{ fontSize: 40 }} />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-700">
            No new notification
          </h3>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="border border-gray-200 rounded-lg p-2 sm:p-4 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold">
                      {notification.payerId.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-medium">
                      <span className="text-blue-600">
                        {notification?.payerId.name}
                      </span>{" "}
                      has marked a payment as completed
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      For expense: {notification?.expenseId?.description}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-green-600 mt-1">
                      ₹{notification.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 sm:mt-0 mt-2 ml-auto">
                  <button
                    onClick={() => openConfirmModal(notification._id)}
                    disabled={processingIds.has(notification._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm rounded-md flex items-center transition-colors disabled:opacity-50"
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
                    onClick={() => openRejectModal(notification._id)}
                    disabled={processingIds.has(notification._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm rounded-md flex items-center transition-colors disabled:opacity-50"
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

      {/* Confirm Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (selectedNotificationId) {
            handleConfirmPayment(selectedNotificationId);
          }
        }}
        title="Confirm Payment"
        message="Are you sure you want to confirm this payment?"
        confirmButtonText="Confirm"
        isConfirming={processingIds.has(selectedNotificationId || "")}
        variant="confirm"
      />

      {/* Reject Modal */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={() => {
          if (selectedNotificationId) {
            handleRejectPayment(selectedNotificationId);
          }
        }}
        title="Reject Payment"
        message="Are you sure you want to reject this payment?"
        confirmButtonText="Reject"
        isConfirming={processingIds.has(selectedNotificationId || "")}
        variant="reject"
      />
    </div>
  );
};

export default Notifications;
