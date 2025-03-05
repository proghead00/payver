import axios from "axios";
import { extractErrorMessage } from "@/utils/errorHandler";
import { Group, Expense } from "@/config/types";
import {
  calculateBalances,
  getOriginalTransactions,
} from "@/utils/balanceUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch group balances by ID
 */
export const fetchGroupBalances = async (groupId: string): Promise<Group> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/group/get-group-balances/${groupId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching group:", error);
    throw error;
  }
};

/**
 * Fetch group details by ID
 */
export const fetchGroup = async (groupId: string): Promise<Group> => {
  try {
    const response = await axios.get(`${API_URL}/api/group/${groupId}`, {
      withCredentials: true,
    });
    return response.data.group;
  } catch (error) {
    console.error("Error fetching group:", error);
    throw error;
  }
};

/**
 * Fetch expenses for a group
 */
export const fetchExpenses = async (groupId: string): Promise<Expense[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/group/expenses/${groupId}`,
      { withCredentials: true }
    );
    return response.data.expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (
  expenseData: any,
  groupId: string
): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/expense/create`,
      { ...expenseData, group: groupId },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  expenseId: string,
  updatedData: any
): Promise<void> => {
  try {
    await axios.put(
      `${API_URL}/api/expense/${expenseId}`,
      { updatedData },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (
  expenseId: string,
  userId: string
): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/expense/${expenseId}`, {
      data: { userId: userId },
      withCredentials: true,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

/**
 * Join an expense
 */
export const joinExpense = async (
  expenseId: string,
  userId: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_URL}/api/expense/join/${expenseId}`,
      { userId },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Error joining expense:", error);
    throw error;
  }
};

/**
 * Leave an expense
 */
export const leaveExpense = async (
  expenseId: string,
  userId: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_URL}/api/expense/leave/${expenseId}`,
      { userId },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Error leaving expense:", error);
    throw error;
  }
};

/**
 * Leave a group
 */
export const leaveGroup = async (
  groupId: string,
  userId: string
): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/group/leave/${groupId}`,
      { currentUserId: userId },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error;
  }
};

/**
 * Delete a group
 */
export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    const response = await axios.delete(`${API_URL}/api/group/${groupId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Error deleting group:", error);

    throw error;
  }
};

/**
 * Process expenses and calculate balances
 */
export const processBalances = (expenses: Expense[], smartMode: boolean) => {
  if (smartMode) {
    // Use optimized balances calculation
    return calculateBalances(expenses);
  } else {
    // Use original transactions without simplification
    return getOriginalTransactions(expenses);
  }
};
