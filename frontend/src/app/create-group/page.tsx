// src/app/create-group/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const router = useRouter();

  const handleCreateGroup = async () => {
    try {
      const formData = new FormData();
      formData.append("name", groupName);
      if (groupPicture) {
        formData.append("picture", groupPicture);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      const groupId = response.data.group._id;

      toast.success(response.data.message);
      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className=" pt-16 mt-10 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create a new group</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full p-2 border rounded-md mb-4"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setGroupPicture(e.target.files?.[0] || null)}
          className="w-full p-2 border rounded-md mb-4"
        />
        <button
          onClick={handleCreateGroup}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Create Group
        </button>
      </div>
    </div>
  );
}
