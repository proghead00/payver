"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();

  // Fetch user information from backend
  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          withCredentials: true,
        }
      );

      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("Token removed due to 401");
        localStorage.removeItem("token");
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="p-8">
      {user ? (
        <>
          <h1 className="text-3xl font-bold">Welcome, {user.name} 👋</h1>
          <p className="text-gray-600 mt-2">
            This is your bill-splitting dashboard.
          </p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
