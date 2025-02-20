"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { extractErrorMessage } from "@/utils/errorHandler";
import { toast } from "react-toastify";
import GroupDetails from "@/components/GroupDetails";
import Chat from "@/components/Chat";
import History from "@/components/History";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params?.id as string;

  const [activeTab, setActiveTab] = useState<"details" | "chat" | "history">(
    "details"
  );
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch group details and expenses
  const fetchGroupData = async () => {
    try {
      const groupResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/${groupId}`,
        { withCredentials: true }
      );

      setGroup(groupResponse.data.group);

      const expensesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/expenses/${groupId}`,
        { withCredentials: true }
      );

      setExpenses(expensesResponse.data.expenses);

      // const historyResponse = await axios.get(
      //   `${process.env.NEXT_PUBLIC_API_URL}/api/payments?group=${groupId}`,
      //   { withCredentials: true }
      // );
      // setHistory(historyResponse.data.payments);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      console.error("Error fetching group data:", error);
    }
  };

  useEffect(() => {
    fetchGroupData();
    const curUserId = localStorage.getItem("userId") as string;
    setCurrentUserId(curUserId);
  }, [groupId]);

  // const handlePayment = async (amount: number, toUserId: string) => {
  //   try {
  //     const response = await axios.post(
  //       `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`,
  //       { amount, toUserId, groupId },
  //       { withCredentials: true }
  //     );
  //     console.log("Payment successful:", response.data);
  //     // Refresh the group data after payment
  //     fetchGroupData();
  //   } catch (error) {
  //     console.error("Error processing payment:", error);
  //   }
  // };

  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/create`,
        { ...expenseData, group },
        { withCredentials: true }
      );
      toast.success(response.data);

      // Refresh the group data after adding expense
      fetchGroupData();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/${groupId}`,
        { withCredentials: true }
      );

      toast.success("Group deleted successfully");
      // Redirect to groups list page
      router.push("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(extractErrorMessage(error) || "Failed to delete group");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isGroupCreator = group && currentUserId === group.createdBy?._id;

  return (
    <div className="pt-16 mt-10 p-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2 px-4 rounded-md ${
              activeTab === "details"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Group Title
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-2 px-4 rounded-md ${
              activeTab === "chat"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-4 rounded-md ${
              activeTab === "history"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            History
          </button>
        </div>

        {isGroupCreator && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200"
          >
            Delete Group
          </button>
        )}
      </div>

      {activeTab === "details" && (
        <GroupDetails
          group={group}
          expenses={expenses}
          // handlePayment={handlePayment}
          handleAddExpense={handleAddExpense}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === "chat" && <Chat groupId={groupId} />}

      {activeTab === "history" && <History history={history} />}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Group
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this group? This will remove all
              expenses and the group data permanently. This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition duration-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
