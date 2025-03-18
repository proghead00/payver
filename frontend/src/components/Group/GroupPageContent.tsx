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
// import History from "../History";
import { toast } from "sonner";
import Notifications from "../Notifications";
import LoadingSpinner from "../Common/LoadingSpinner";

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
    error,
  } = useGroupContext();

  useEffect(() => {
    // Redirect if there's an authorization error or group not found
    if (!isLoading) {
      if (error?.status === 403) {
        toast.error(
          "You do not have access to this group. Redirecting to Dashboard."
        );
        router.push("/dashboard");
      } else if (!group) {
        toast.error("Group not found. Redirecting to Dashboard.");
        router.push("/dashboard");
      }
    }
  }, [group, isLoading, router, error]);

  // Return early if still loading or no group
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return null; // Will be redirected by the useEffect
  }

  const isGroupCreator = currentUserId === group.createdBy?._id;

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
      <div className="w-full max-w-4xl mx-auto">
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

            {/* <button
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
            </button> */}

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
              Notifications
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
        {activeTab === "history" && <Notifications />}

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
    </div>
  );
}
