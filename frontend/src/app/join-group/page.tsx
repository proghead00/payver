// src/app/join-group/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/errorHandler";

export default function JoinGroup() {
  const [inviteLink, setInviteLink] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoinGroup = async () => {
    if (!inviteLink.trim()) {
      toast.error("Please enter an invite link");
      return;
    }

    setIsJoining(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/join`,
        { inviteLink },
        { withCredentials: true }
      );

      const groupId = response.data.group._id;

      toast.success(response.data.message);
      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="pt-16 mt-10 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Join a group</h2>
        <input
          type="text"
          placeholder="Invite Link"
          value={inviteLink}
          onChange={(e) => setInviteLink(e.target.value)}
          className="w-full p-2 border rounded-md mb-4"
          disabled={isJoining}
        />
        <button
          onClick={handleJoinGroup}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300"
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join Group"}
        </button>
      </div>
    </div>
  );
}
