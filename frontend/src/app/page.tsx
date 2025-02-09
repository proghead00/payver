"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold text-gray-800">
        Split Bills Effortlessly
      </h1>
      <p className="text-gray-600 mt-2">
        Track and manage expenses with friends easily.
      </p>
      <div className="mt-6 space-x-4">
        <Link
          href="/register"
          className="px-6 py-3 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
