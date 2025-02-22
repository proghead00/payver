import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import { Expense, Group } from "../../config/types";

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
  expenses: Expense[];
  currentUserId: string;
}

export const useGroupDetailsLogic = ({
  group,
  expenses,
  currentUserId,
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

  const getBalances = () => {
    return smartBalanceMode ? balances.netBalances : balances.actualBalances;
  };

  const getSimplifiedBalances = (): Balance[] => {
    const currentBalances = getBalances();
    const simplifiedBalances: Balance[] = [];

    Object.entries(currentBalances).forEach(([userId, userBalances]) => {
      Object.entries(userBalances).forEach(([otherUserId, amount]) => {
        if (amount > 0) {
          simplifiedBalances.push({
            from: userId,
            to: otherUserId,
            amount: amount,
            originalAmount: amount,
          });
        }
      });
    });

    return simplifiedBalances;
  };

  const handleUpdateExpense = async (expenseId: string, updatedData: any) => {
    try {
      console.log({ updatedData });
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}`,
        { updatedData },
        { withCredentials: true }
      );
      toast.success("Expense updated successfully");
      // fetchBalances();
      // return Promise.resolve();
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
      // fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to delete expense");
      return Promise.reject(error);
    }
  };

  const handleJoinExpense = async (expenseId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/join/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Joined expense successfully");
      fetchBalances();
      return Promise.resolve();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to join expense");
      return Promise.reject(error);
    }
  };

  const handleMarkAsPaid = async (toUserId: string, amount: number) => {
    try {
      if (!group) return;
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, {
        groupId: group._id,
        fromUserId: currentUserId,
        toUserId,
        amount,
      });
      toast.success("Payment marked as completed");
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to mark payment");
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/groups/leave/${group._id}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Successfully left the group");
      // Redirect or update UI as needed
      window.location.href = "/dashboard"; // or use router.push
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to leave group");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group || !isAdmin) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group._id}/remove-member`,
        { userId: memberId },
        { withCredentials: true }
      );
      toast.success("Member removed successfully");
      // Refresh group data
      window.location.reload();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to remove member");
    }
  };

  const handleLeaveExpense = async (expenseId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/leave/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Successfully left the expense");
      // Refresh balances and expenses
      fetchBalances();
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to leave expense");
    }
  };

  const handleRemoveFromExpense = async (expenseId: string, userId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}/remove-member`,
        { userId },
        { withCredentials: true }
      );
      toast.success("Member removed from expense");
      fetchBalances();
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || "Failed to remove member from expense"
      );
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
    getSimplifiedBalances,
    handleUpdateExpense,
    handleDeleteExpense,
    handleJoinExpense,
    handleMarkAsPaid,
    fetchBalances,
    isAdmin,
    handleLeaveGroup,
    handleRemoveMember,
    handleLeaveExpense,
    handleRemoveFromExpense,
  };
};
