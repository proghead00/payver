// src/context/GroupContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import { Group, Expense } from "@/config/types";

interface GroupContextType {
  group: Group | null;
  expenses: Expense[];
  history: any[];
  currentUserId: string;
  isDeleting: boolean;
  isLoading: boolean;
  activeTab: "details" | "chat" | "history";
  showExpenseForm: boolean;
  selectedExpenseId: string | null;
  smartBalanceMode: boolean;
  showAllBalances: boolean;
  simplifiedBalances: any[];

  // Actions
  setActiveTab: (tab: "details" | "chat" | "history") => void;
  setShowExpenseForm: (show: boolean) => void;
  setSelectedExpenseId: (id: string | null) => void;
  setSmartBalanceMode: (mode: boolean) => void;
  setShowAllBalances: (show: boolean) => void;

  // Group operations
  fetchGroupData: () => Promise<void>;
  handleAddExpense: (expenseData: any) => Promise<void>;
  handleUpdateExpense: (expenseId: string, updatedData: any) => Promise<void>;
  handleLeaveGroup: () => Promise<void>;
  handleDeleteGroup: () => Promise<void>;
  handleDeleteExpense: (expenseId: string) => Promise<void>;
  handleJoinExpense: (expenseId: string) => Promise<void>;
  handleLeaveExpense: (expenseId: string) => Promise<void>;
  handleMarkAsPaid: (userId: string, amount: number) => void;
  getSimplifiedBalances: () => any[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return context;
};

interface GroupProviderProps {
  children: ReactNode;
  groupId: string;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({
  children,
  groupId,
}) => {
  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<"details" | "chat" | "history">(
    "details"
  );
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [smartBalanceMode, setSmartBalanceMode] = useState(true);
  const [showAllBalances, setShowAllBalances] = useState(false);
  const [simplifiedBalances, setSimplifiedBalances] = useState<any[]>([]);

  // Fetch group details and expenses
  const fetchGroupData = async () => {
    setIsLoading(true);
    try {
      const groupResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/${groupId}`,
        { withCredentials: true }
      );
      setGroup(groupResponse.data.group);

      const expensesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/expenses/${groupId}`,
        { withCredentials: true }
      );
      setExpenses(expensesResponse.data.expenses);
      console.log({ GHHERE: expensesResponse.data });

      // Calculate balances
      const balances = calculateBalances(expensesResponse.data.expenses);
      setSimplifiedBalances(balances);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      console.error("Error fetching group data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate balances between users
  const calculateBalances = (expenseList: Expense[]) => {
    // Implement your balance calculation logic here
    // This is a simplified placeholder
    const balances: any[] = [];

    // Process each expense
    expenseList.forEach((expense) => {
      if (!expense.paidBy || !expense.splitDetails) return;

      const paidById =
        typeof expense.paidBy === "string"
          ? expense.paidBy
          : expense.paidBy._id;

      expense.splitDetails.forEach((split) => {
        const userId =
          typeof split.user === "string" ? split.user : split.user._id;

        if (userId === paidById || split.amount <= 0) return;

        // Add to balances
        balances.push({
          from: userId,
          to: paidById,
          amount: split.amount,
        });
      });
    });

    // Combine balances between same pairs of users
    const combinedBalances = new Map();

    balances.forEach((balance) => {
      const key = `${balance.from}-${balance.to}`;
      const reverseKey = `${balance.to}-${balance.from}`;

      if (combinedBalances.has(reverseKey)) {
        const existing = combinedBalances.get(reverseKey);
        if (existing.amount > balance.amount) {
          existing.amount -= balance.amount;
        } else {
          combinedBalances.delete(reverseKey);
          if (existing.amount < balance.amount) {
            combinedBalances.set(key, {
              from: balance.from,
              to: balance.to,
              amount: balance.amount - existing.amount,
            });
          }
        }
      } else if (combinedBalances.has(key)) {
        const existing = combinedBalances.get(key);
        existing.amount += balance.amount;
      } else {
        combinedBalances.set(key, { ...balance });
      }
    });

    return Array.from(combinedBalances.values());
  };

  // Get simplified balances for UI
  const getSimplifiedBalances = () => {
    return simplifiedBalances;
  };

  // Add new expense
  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/create`,
        { ...expenseData, group: group?._id },
        { withCredentials: true }
      );
      toast.success(response.data);
      await fetchGroupData(); // Refresh data after adding expense
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Update existing expense
  const handleUpdateExpense = async (expenseId: string, updatedData: any) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}`,
        { updatedData },
        { withCredentials: true }
      );
      toast.success("Expense updated successfully");
      await fetchGroupData(); // Refresh data after update
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Delete an expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/${expenseId}`,
        { withCredentials: true }
      );
      toast.success("Expense deleted successfully");
      setSelectedExpenseId(null);
      await fetchGroupData(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Join an expense
  const handleJoinExpense = async (expenseId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/join/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Successfully joined expense");
      await fetchGroupData(); // Refresh data after joining
    } catch (error) {
      console.error("Error joining expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Leave an expense
  const handleLeaveExpense = async (expenseId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/leave/${expenseId}`,
        { userId: currentUserId },
        { withCredentials: true }
      );
      toast.success("Successfully left expense");
      await fetchGroupData(); // Refresh data after leaving
    } catch (error) {
      console.error("Error leaving expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Mark debt as paid
  const handleMarkAsPaid = (userId: string, amount: number) => {
    // Implement mark as paid logic
    toast.success(
      `Marked ₹${amount} as paid to ${
        group?.members.find((m) => m._id === userId)?.name || "user"
      }`
    );
    // In a real implementation, you would update the server and refresh data
    // For now, we just show a success message
  };

  // Leave group
  const handleLeaveGroup = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/leave/${groupId}`,
        { currentUserId },
        { withCredentials: true }
      );
      toast.success(response.data);
      // Redirect would typically happen after this
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/${groupId}`,
        { withCredentials: true }
      );
      toast.success(response.data);
      // Redirect would typically happen after this
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(extractErrorMessage(error) || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
    }

    fetchGroupData();
  }, [groupId]);

  const value = {
    // State
    group,
    expenses,
    history,
    currentUserId,
    isDeleting,
    isLoading,
    activeTab,
    showExpenseForm,
    selectedExpenseId,
    smartBalanceMode,
    showAllBalances,
    simplifiedBalances,

    // Setters
    setActiveTab,
    setShowExpenseForm,
    setSelectedExpenseId,
    setSmartBalanceMode,
    setShowAllBalances,

    // Actions
    fetchGroupData,
    handleAddExpense,
    handleUpdateExpense,
    handleLeaveGroup,
    handleDeleteGroup,
    handleDeleteExpense,
    handleJoinExpense,
    handleLeaveExpense,
    handleMarkAsPaid,
    getSimplifiedBalances,
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
};
