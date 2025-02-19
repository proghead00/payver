// src/app/group/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params?.id;
  const [activeTab, setActiveTab] = useState("details");

  const handlePayment = async (amount: number, toUserId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`,
        { amount, toUserId, groupId },
        { withCredentials: true }
      );
      console.log("Payment successful:", response.data);
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  return (
    <div className="pt-16 mt-10 p-8">
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab("details")}
          className={`py-2 px-4 rounded-md ${
            activeTab === "details"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Group Details
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
      </div>

      {activeTab === "details" ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Group Details</h2>
          {/* Render group details here */}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
          {/* Render chat here */}
        </div>
      )}
    </div>
  );
}
