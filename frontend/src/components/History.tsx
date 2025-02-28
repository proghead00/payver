import React from "react";
import { useGroupContext } from "@/context/GroupContext/GroupContext";

const History: React.FC = () => {
  const { history, group } = useGroupContext();

  if (!group) return null;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {group.name} History
      </h2>
      {history && history.length > 0 ? (
        <ul className="space-y-2">
          {history.map((item, index) => (
            <li key={index} className="p-3 bg-gray-50 rounded-lg">
              {item.description}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 p-4">No history available.</p>
      )}
    </div>
  );
};

export default History;
