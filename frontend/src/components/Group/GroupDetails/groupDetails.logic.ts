"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import { Expense, Group } from "../../../config/types";

interface Balance {
  from: string;
  to: string;
  amount: number;
  originalAmount: number;
}

interface BalanceResponse {
  success: boolean;
  actualBalances: Record<string, Record<string, number>>;
  netBalances: Record<string, Record<string, number>>;
}

interface UseGroupDetailsLogicProps {
  group: Group | null;
  currentUserId: string;
  dispatch: (action: any) => void;
  expenses: Expense[];
}

export const useGroupDetailsLogic = ({
  group,
  currentUserId,
  dispatch,
  expenses,
}: UseGroupDetailsLogicProps) => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [smartBalanceMode, setSmartBalanceMode] = useState(true);
  const [showAllBalances, setShowAllBalances] = useState(false);
  const [balances, setBalances] = useState<{
    actualBalances: Record<string, Record<string, number>>;
    netBalances: Record<string, Record<string, number>>;
  }>({
    actualBalances: {},
    netBalances: {},
  });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (group) {
      setIsAdmin(group.admin === currentUserId);
      fetchBalances();
    }
  }, [group, expenses]);

  const fetchBalances = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const response = await axios.get<BalanceResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/balances/${group._id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setBalances({
          actualBalances: response.data.actualBalances,
          netBalances: response.data.netBalances,
        });
      } else {
        toast.error("Failed to fetch balances");
      }
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Error fetching balances");
    } finally {
      setLoading(false);
    }
  };

  // Added missing getSimplifiedBalances function
  const getSimplifiedBalances = () => {
    if (!group || smartBalanceMode) {
      return Object.entries(balances.netBalances)
        .map(([from, toBalances]) =>
          Object.entries(toBalances).map(([to, amount]) => ({
            from,
            to,
            amount,
            originalAmount: balances.actualBalances[from]?.[to] || 0,
          }))
        )
        .flat()
        .filter((balance) => balance.amount !== 0);
    }

    return Object.entries(balances.actualBalances)
      .map(([from, toBalances]) =>
        Object.entries(toBalances).map(([to, amount]) => ({
          from,
          to,
          amount,
          originalAmount: amount,
        }))
      )
      .flat()
      .filter((balance) => balance.amount !== 0);
  };

  // Added missing handleAddExpense function
  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense`,
        expenseData,
        { withCredentials: true }
      );

      dispatch({ type: "ADD_EXPENSE", payload: response.data });
      toast.success("Expense added successfully");
      setShowExpenseForm(false);
      fetchBalances();
      return response.data;
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to add expense");
      return Promise.reject(error);
    }
  };

  const handleUpdateExpense = async (expenseId: string, updatedData: any) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}`,
        updatedData,
        { withCredentials: true }
      );
      toast.success("Expense updated successfully");
      dispatch({ type: "UPDATE_EXPENSE", payload: response.data });
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to update expense");
      return Promise.reject(error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}`,
        {
          data: { userId: currentUserId },
          withCredentials: true,
        }
      );
      toast.success("Expense deleted successfully");
      dispatch({ type: "DELETE_EXPENSE", payload: expenseId });
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to delete expense");
      return Promise.reject(error);
    }
  };

  const handleJoinExpense = async (expenseId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/join/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Joined expense successfully");
      dispatch({ type: "JOIN_EXPENSE", payload: response.data });
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to join expense");
      return Promise.reject(error);
    }
  };

  const handleLeaveExpense = async (expenseId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/leave/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Successfully left the expense");
      dispatch({ type: "LEAVE_EXPENSE", payload: response.data });
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to leave expense");
      return Promise.reject(error);
    }
  };

  // Added missing handleMarkAsPaid function
  const handleMarkAsPaid = async (fromUserId: string, toUserId: string) => {
    if (!group) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/markAsPaid`,
        {
          groupId: group._id,
          fromUserId,
          toUserId,
        },
        { withCredentials: true }
      );

      toast.success("Payment marked as completed");
      fetchBalances();
      return response.data;
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || "Failed to mark payment as completed"
      );
      return Promise.reject(error);
    }
  };

  return {
    showExpenseForm,
    setShowExpenseForm,
    selectedExpenseId,
    setSelectedExpenseId,
    smartBalanceMode,
    setSmartBalanceMode,
    showAllBalances,
    setShowAllBalances,
    loading,
    balances,
    getSimplifiedBalances,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleJoinExpense,
    handleLeaveExpense,
    handleMarkAsPaid,
    isAdmin,
  };
};
