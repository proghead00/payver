// src/components/Chat.tsx
import React from "react";
import { useParams } from "next/navigation";
import { useGroupContext } from "@/context/GroupContext";

const Chat: React.FC = () => {
  const { group } = useGroupContext();

  if (!group) return null;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Chat with {group.name} members
      </h2>
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-500">
          Chat functionality will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default Chat;
