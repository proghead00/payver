import { useState, useCallback, useEffect } from "react";
import { Group, Expense } from "@/config/types";
import * as groupServices from "@/services/groupServices";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import axios from "axios";

// Define action types
export enum ActionTypes {
  SET_ACTIVE_TAB = "SET_ACTIVE_TAB",
  TOGGLE_EXPENSE_FORM = "TOGGLE_EXPENSE_FORM",
  SELECT_EXPENSE = "SELECT_EXPENSE",
  TOGGLE_SMART_BALANCE = "TOGGLE_SMART_BALANCE",
  TOGGLE_ALL_BALANCES = "TOGGLE_ALL_BALANCES",
  MARK_AS_PAID = "MARK_AS_PAID",
}

// Define action interfaces
interface SetActiveTabAction {
  type: ActionTypes.SET_ACTIVE_TAB;
  payload: "details" | "chat" | "history";
}

interface ToggleExpenseFormAction {
  type: ActionTypes.TOGGLE_EXPENSE_FORM;
  payload: boolean;
}

interface SelectExpenseAction {
  type: ActionTypes.SELECT_EXPENSE;
  payload: string | null;
}

interface ToggleSmartBalanceAction {
  type: ActionTypes.TOGGLE_SMART_BALANCE;
  payload: boolean;
}

interface ToggleAllBalancesAction {
  type: ActionTypes.TOGGLE_ALL_BALANCES;
  payload: boolean;
}

interface MarkAsPaidAction {
  type: ActionTypes.MARK_AS_PAID;
  payload: { userId: string; amount: number };
}

// Union type for all actions
type GroupAction =
  | SetActiveTabAction
  | ToggleExpenseFormAction
  | SelectExpenseAction
  | ToggleSmartBalanceAction
  | ToggleAllBalancesAction
  | MarkAsPaidAction;

export interface GroupLogicReturn {
  // State
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
  allBalances: any[];
  fetchSimplifiedBalances: () => Promise<void>;

  // Actions dispatcher
  dispatch: (action: GroupAction) => void;

  // Group operations
  fetchGroupData: () => Promise<void>;
  addExpense: (expenseData: any) => Promise<void>;
  updateExpense: (expenseId: string, updatedData: any) => Promise<void>;
  deleteExpense: (expenseId: string, currentUserId: string) => Promise<void>;
  joinExpense: (expenseId: string) => Promise<void>;
  leaveExpense: (expenseId: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  deleteGroup: () => Promise<void>;
  handleMarkAsPaid: (userId: string, amount: number) => void;
  getSimplifiedBalances: () => any[];

  // Additional methods
  setSelectedExpenseId: (id: string | null) => void;
  setShowExpenseForm: (show: boolean) => void;
}

export const useGroupLogic = (groupId: string): GroupLogicReturn => {
  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "chat" | "history">(
    "details"
  );
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [smartBalanceMode, setSmartBalanceMode] = useState(false);

  const [showAllBalances, setShowAllBalances] = useState(false);
  const [allBalances, setAllBalances] = useState<any[]>([]);

  // Fetch group data without processing balances
  const fetchGroupData = useCallback(async () => {
    setIsLoading(true);
    try {
      const groupData = await groupServices.fetchGroup(groupId);
      setGroup(groupData);

      const expensesData = await groupServices.fetchExpenses(groupId);
      setExpenses(expensesData);

      // Process balances separately (will be called by the effect)
      processBalances(expensesData);
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Process balances separately based on current state
  const processBalances = useCallback(
    (expensesData: Expense[] = expenses) => {
      console.log({ sds: expenses });
      const balances = groupServices.processBalances(
        expensesData,
        smartBalanceMode
      );
      setAllBalances(balances);
    },
    [smartBalanceMode, expenses]
  );

  // Action dispatcher
  const dispatch = useCallback((action: GroupAction) => {
    switch (action.type) {
      case ActionTypes.SET_ACTIVE_TAB:
        setActiveTab(action.payload);
        break;
      case ActionTypes.TOGGLE_EXPENSE_FORM:
        setShowExpenseForm(action.payload);
        break;
      case ActionTypes.SELECT_EXPENSE:
        setSelectedExpenseId(action.payload);
        break;
      case ActionTypes.TOGGLE_SMART_BALANCE:
        setSmartBalanceMode(action.payload);
        // Balance processing will happen in the useEffect
        break;
      case ActionTypes.TOGGLE_ALL_BALANCES:
        setShowAllBalances(action.payload);
        break;
      case ActionTypes.MARK_AS_PAID:
        handleMarkAsPaid(action.payload.userId, action.payload.amount);
        break;
      default:
        console.error("Unknown action type");
    }
  }, []);

  // Recalculate balances when smartBalanceMode or expenses change
  useEffect(() => {
    processBalances();
  }, [smartBalanceMode, expenses, processBalances]);

  // CALL SERVICES ------------------------------------------------------------

  const handleAddExpense = useCallback(
    async (expenseData: any) => {
      try {
        await groupServices.createExpense(expenseData, groupId);
        await fetchGroupData(); // Need to fetch after adding an expense
      } catch (error) {
        console.error("Error creating expense:", error);
      }
    },
    [groupId, fetchGroupData]
  );

  const handleUpdateExpense = useCallback(
    async (expenseId: string, updatedData: any) => {
      try {
        await groupServices.updateExpense(expenseId, updatedData);
        await fetchGroupData(); // Need to fetch after updating an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to update expense");
        return Promise.reject(error);
      }
    },
    [fetchGroupData]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string, currentUserId: string) => {
      try {
        await groupServices.deleteExpense(expenseId, currentUserId);
        await fetchGroupData(); // Need to fetch after deleting an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to delete expense");
        return Promise.reject(error);
      }
    },
    [fetchGroupData]
  );

  const handleJoinExpense = useCallback(
    async (expenseId: string) => {
      try {
        await groupServices.joinExpense(expenseId, currentUserId);
        await fetchGroupData(); // Need to fetch after joining an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to join expense");
        return Promise.reject(error);
      }
    },
    [currentUserId, fetchGroupData]
  );

  const handleLeaveExpense = useCallback(
    async (expenseId: string) => {
      try {
        await groupServices.leaveExpense(expenseId, currentUserId);
        await fetchGroupData(); // Need to fetch after leaving an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to leave expense");
      }
    },
    [currentUserId, fetchGroupData]
  );

  const leaveGroup = useCallback(async () => {
    try {
      await groupServices.leaveGroup(groupId, currentUserId);
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to leave group");
    }
  }, [groupId, currentUserId]);

  const deleteGroup = useCallback(async () => {
    setIsDeleting(true);
    try {
      await groupServices.deleteGroup(groupId);
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  }, [groupId]);

  const handleMarkAsPaid = useCallback((userId: string, amount: number) => {
    console.log(`Marked ₹${amount} as paid to user ${userId}`);
  }, []);

  const getSimplifiedBalances = useCallback(() => {
    return allBalances;
  }, [allBalances]);

  const fetchSimplifiedBalances = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/expense/simplified-balances/${groupId}`
      );
      setAllBalances(response.data.balances);
    } catch (error) {
      console.error("Error fetching simplified balances:", error);
    }
  }, [groupId]);

  // ------------------------------------------------------------

  const handleUPIPayment = useCallback(
    async (expenseId: string, userId: string, amount: number) => {
      try {
        // Simulate UPI payment
        toast.info("Redirecting to UPI app...");

        // Simulate a successful payment
        setTimeout(() => {
          toast.success(
            `Payment of ₹${amount.toFixed(2)} completed successfully!`
          );
          // Mark the payment as completed in the backend
          markPaymentAsCompleted(expenseId, userId, amount);
        }, 2000);
      } catch (error) {
        toast.error("Payment failed. Please try again.");
        console.error("Error processing UPI payment:", error);
      }
    },
    []
  );

  const markPaymentAsCompleted = useCallback(
    async (expenseId: string, userId: string, amount: number) => {
      try {
        // Call the backend API to mark the payment as completed
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/expense/mark-paid`,
          { expenseId, userId, amount },
          { withCredentials: true }
        );

        // Refresh the group data to reflect the updated payment status
        await fetchGroupData();
      } catch (error) {
        toast.error("Failed to mark payment as completed.");
        console.error("Error marking payment as completed:", error);
      }
    },
    [fetchGroupData]
  );
  // Load initial data
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
    }

    fetchGroupData();
  }, [groupId, fetchGroupData]);

  return {
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
    allBalances,
    fetchSimplifiedBalances,

    // Actions
    dispatch,
    fetchGroupData,
    addExpense: handleAddExpense,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
    joinExpense: handleJoinExpense,
    leaveExpense: handleLeaveExpense,
    leaveGroup,
    deleteGroup,
    handleMarkAsPaid,
    getSimplifiedBalances,

    // Additional methods
    setSelectedExpenseId,
    setShowExpenseForm,
    // handleUPIPayment,
    // fetchGroupData,
  };
};
