"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonIcon from "@mui/icons-material/Person";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { Add } from "@mui/icons-material";

export default function Dashboard() {
  const [userData, setUserData] = useState<{
    user: { name: string };
    groups: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          withCredentials: true,
        }
      );
      setUserData({
        user: response.data.user,
        groups: response.data.groups,
      });

      localStorage.setItem("userId", response.data.user._id);
    } catch (error) {
      console.error("Error fetching user:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="mt-10 min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 pb-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : userData ? (
        <div className="max-w-4xl mx-auto px-4 pt-16">
          {/* Welcome Message */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome,{" "}
              <span className="text-blue-600">{userData.user.name}</span> 👋
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your shared expenses and settle debts with friends.
            </p>
          </div>

          {/* Create/Join Group Buttons */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Group Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/create-group")}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-center justify-center"
              >
                <span className="mr-2">
                  <AddIcon />
                </span>
                Create a new group
              </button>
              <button
                onClick={() => router.push("/join-group")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg shadow hover:shadow-lg transition duration-300 flex items-center justify-center"
              >
                <span className="mr-2">
                  <PersonAddIcon />
                </span>
                Join a group
              </button>
            </div>
          </div>

          {/* Display User's Groups */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
              Your Groups
            </h2>

            {userData.groups && userData.groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.groups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-gray-50 p-5 rounded-lg shadow border border-gray-100 hover:shadow-md transition duration-300"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 truncate">
                      {group.name}
                    </h3>
                    <div className="mt-3 space-y-1">
                      <p className="text-gray-600 flex items-center">
                        <span className="mr-2">
                          <PersonIcon />
                        </span>
                        Created by:{" "}
                        <span className="font-medium ml-1">
                          {group.createdBy.name}
                        </span>
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <span className="mr-2">
                          <PeopleOutlineIcon />
                        </span>
                        Members:
                        <span className="font-medium ml-1">
                          {group.members.length}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/group/${group._id}`)}
                      className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                    >
                      <span className="mr-2">View Group</span>

                      <ArrowForwardIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600 mb-4">
                  You have no groups yet. Create your first one!
                </p>
                <button
                  onClick={() => router.push("/create-group")}
                  className="mr-4 bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition duration-300 inline-flex items-center"
                >
                  Create your first group
                  <Add />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-xl shadow-md flex justify-center">
            <p className="text-red-500">
              Error loading data. Please try again later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
