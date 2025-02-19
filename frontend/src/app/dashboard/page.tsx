"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Dashboard() {
  const [userData, setUserData] = useState<{
    user: { name: string };
    groups: any[];
  } | null>(null);

  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          withCredentials: true,
        }
      );
      console.log("User data:", response.data);
      setUserData({
        user: response.data.user,
        groups: response.data.groups,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    fetchUser();
    console.log("User data:", userData);
  }, []);

  return (
    <div className="p-8">
      {userData ? (
        userData.groups && userData.groups.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold">
              Welcome, {userData.user.name} 👋
            </h1>
            <p className="text-gray-600 mt-2">
              {JSON.stringify(userData, null, 2)}
            </p>
            {/* Render group details and chat tabs here */}
          </>
        ) : (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">You have no groups</h2>
            <button
              onClick={() => router.push("/create-group")}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md mb-2 hover:bg-blue-600"
            >
              Create a new group
            </button>
            <button
              onClick={() => router.push("/join-group")}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              Join a group
            </button>
          </div>
        )
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
