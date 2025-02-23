"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGroupPageLogic } from "./groupPage.logic";
import GroupDetails from "@/components/Group/GroupDetails";
import Chat from "@/components/Chat";
import History from "@/components/History";
import ConfirmationModal from "@/components/Common/ConfirmationModal";

export default function GroupPage() {
  const params = useParams();
  const groupId = params?.id as string;

  const [activeTab, setActiveTab] = useState<"details" | "chat" | "history">(
    "details"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    group,
    expenses,
    history,
    currentUserId,
    isDeleting,
    fetchGroupData,
    handleAddExpense,
    handleLeaveGroup,
    handleDeleteGroup,
  } = useGroupPageLogic(groupId);

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
          isGroupCreator ? handleDeleteGroup() : handleLeaveGroup()
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
