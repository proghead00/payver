import axios, { AxiosResponse } from "axios";
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
    const response: AxiosResponse<Group> = await axios.get(
      `${API_URL}/api/group/get-group-balances/${groupId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching group balances:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Fetch group details by ID
 */
export const fetchGroup = async (groupId: string): Promise<Group> => {
  try {
    const response: AxiosResponse<{ group: Group }> = await axios.get(
      `${API_URL}/api/group/${groupId}`,
      { withCredentials: true }
    );
    return response.data.group;
  } catch (error: any) {
    console.error("Error fetching group:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Fetch expenses for a group
 */
export const fetchExpenses = async (groupId: string): Promise<Expense[]> => {
  try {
    const response: AxiosResponse<{ expenses: Expense[] }> = await axios.get(
      `${API_URL}/api/group/expenses/${groupId}`,
      { withCredentials: true }
    );
    return response.data.expenses;
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (
  expenseData: any,
  groupId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.post(
      `${API_URL}/api/expense/create`,
      { ...expenseData, group: groupId },
      { withCredentials: true }
    );
  } catch (error: any) {
    console.error("Error creating expense:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  expenseId: string,
  updatedData: any
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.put(
      `${API_URL}/api/expense/${expenseId}`,
      { updatedData },
      { withCredentials: true }
    );
  } catch (error: any) {
    console.error("Error updating expense:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (
  expenseId: string,
  userId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.delete(`${API_URL}/api/expense/${expenseId}`, {
      data: { userId },
      withCredentials: true,
    });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Join an expense
 */
export const joinExpense = async (
  expenseId: string,
  userId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.post(
      `${API_URL}/api/expense/join/${expenseId}`,
      { userId },
      { withCredentials: true }
    );
  } catch (error: any) {
    console.error("Error joining expense:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Leave an expense
 */
export const leaveExpense = async (
  expenseId: string,
  userId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.post(
      `${API_URL}/api/expense/leave/${expenseId}`,
      { userId },
      { withCredentials: true }
    );
  } catch (error: any) {
    console.error("Error leaving expense:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Leave a group
 */
export const leaveGroup = async (
  groupId: string,
  userId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.post(
      `${API_URL}/api/group/leave/${groupId}`,
      { currentUserId: userId },
      { withCredentials: true }
    );
  } catch (error: any) {
    console.error("Error leaving group:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Delete a group
 */
export const deleteGroup = async (
  groupId: string
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.delete(`${API_URL}/api/group/${groupId}`, {
      withCredentials: true,
    });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * Process expenses and calculate balances
 */
export const processBalances = (expenses: Expense[], smartMode: boolean) => {
  return smartMode
    ? calculateBalances(expenses)
    : getOriginalTransactions(expenses);
};

/**
 * Update Smart Balance Mode
 */
export const updateSmartBalanceMode = async (
  groupId: string,
  smartMode: boolean
): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/group/update-smart-mode`,
      { groupId, smartMode },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating Smart Mode:", error);
    throw new Error(extractErrorMessage(error));
  }
};
