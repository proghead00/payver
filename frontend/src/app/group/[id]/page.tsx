"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { extractErrorMessage } from "@/utils/errorHandler";
import { toast } from "react-toastify";
import GroupDetails from "@/components/GroupDetails/GroupDetails";
import Chat from "@/components/Chat";
import History from "@/components/History";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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

  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/create`,
        { ...expenseData, group },
        { withCredentials: true }
      );
      toast.success(response.data);
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleLeaveGroup = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/leave/${groupId}`,
        { currentUserId },
        { withCredentials: true }
      );

      toast.success(response.data);
      router.push("/dashboard");
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

      toast.success(response.data);

      router.push("/dashboard");
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
            About Group
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

        {isGroupCreator ? (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200"
          >
            Delete Group
          </button>
        ) : (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200"
          >
            Leave Group
          </button>
        )}
      </div>

      {activeTab === "details" && (
        <GroupDetails
          group={group}
          expenses={expenses}
          handleAddExpense={handleAddExpense}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === "chat" && <Chat groupId={groupId} />}

      {activeTab === "history" && <History history={history} />}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() =>
          isGroupCreator ? handleDeleteGroup() : handleLeaveGroup(groupId)
        }
        title={isGroupCreator ? "Delete Group" : "Leave Group"}
        message={
          isGroupCreator
            ? "Are you sure you want to delete this group? This will remove all expenses and the group data permanently. This action cannot be undone."
            : "Are you sure you want to leave this group? You will no longer have access to its expenses or chat."
        }
        confirmButtonText={isGroupCreator ? "Delete Group" : "Leave Group"}
        isConfirming={isDeleting}
      />
    </div>
  );
}
