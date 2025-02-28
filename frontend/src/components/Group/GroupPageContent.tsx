"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useGroupContext,
  ActionTypes,
} from "@/context/GroupContext/GroupContext";
import GroupDetails from "@/components/Group/GroupDetails";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import Chat from "../Chat";
import History from "../History";
import { toast } from "react-toastify";

export default function GroupPageContent() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    group,
    currentUserId,
    isDeleting,
    activeTab,
    dispatch,
    leaveGroup,
    deleteGroup,
    isLoading,
  } = useGroupContext();

  useEffect(() => {
    // Only check for the group if loading is complete
    if (!isLoading && !group) {
      toast.error("Group not found, redirecting you to Dashboard");
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  }, [group, isLoading, router]);

  const isGroupCreator = group && currentUserId === group.createdBy?._id;

  const handleConfirmAction = async () => {
    if (isGroupCreator) {
      await deleteGroup();
    } else {
      await leaveGroup();
    }
    router.push("/dashboard");
  };

  return (
    <div className="pt-16 mt-10 p-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() =>
              dispatch({
                type: ActionTypes.SET_ACTIVE_TAB,
                payload: "details",
              })
            }
            className={`py-2 px-4 rounded-md ${
              activeTab === "details"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            About Group
          </button>

          <button
            onClick={() =>
              dispatch({
                type: ActionTypes.SET_ACTIVE_TAB,
                payload: "chat",
              })
            }
            className={`py-2 px-4 rounded-md ${
              activeTab === "chat"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Chat
          </button>

          <button
            onClick={() =>
              dispatch({
                type: ActionTypes.SET_ACTIVE_TAB,
                payload: "history",
              })
            }
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

      {activeTab === "details" && <GroupDetails />}
      {activeTab === "chat" && <Chat />}
      {activeTab === "history" && <History />}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmAction}
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
