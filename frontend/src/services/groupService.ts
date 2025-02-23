import axios from "axios";
import { Group, Expense } from "@/config/types";

export const fetchGroups = async (): Promise<Group[]> => {
  try {
    console.log("Fetching groups...");
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/group/get-all-groups`,
      { withCredentials: true }
    );

    console.log("Groups API Response:", response.data);

    // Check if response.data is the array directly
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // If response has a data property containing the array
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // If response has groups property
    if (response.data.groups && Array.isArray(response.data.groups)) {
      return response.data.groups;
    }

    // If we got a response but not in expected format
    console.error("Unexpected response structure:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching group data:", error);
    // Return empty array instead of throwing
    return [];
  }
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  try {
    console.log("Fetching expenses...");
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/expense/get-all-expenses`,
      { withCredentials: true }
    );

    console.log("Expenses API Response:", response.data);

    // Check if response.data is the array directly
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // If response has a data property containing the array
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // If response has expenses property
    if (response.data.expenses && Array.isArray(response.data.expenses)) {
      return response.data.expenses;
    }

    // If we got a response but not in expected format
    console.error("Unexpected response structure:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching expense data:", error);
    // Return empty array instead of throwing
    return [];
  }
};
