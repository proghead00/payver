// src/components/Members/MembersSection.tsx
import React from "react";
import { useGroupContext } from "@/context/GroupContext";

const MembersSection: React.FC = () => {
  const { group, currentUserId } = useGroupContext();

  if (!group) return null;

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Members</h3>
      <div className="flex flex-wrap gap-2">
        {group.members.map((member) => (
          <div
            key={member._id}
            className="flex items-center bg-gray-50 p-2 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {member.name.charAt(0)}
            </div>
            <span className="ml-2 text-gray-700">
              {member.name} {member._id === currentUserId && "(You)"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersSection;
