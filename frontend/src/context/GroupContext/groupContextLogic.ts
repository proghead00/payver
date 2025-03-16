import { useState, useCallback, useEffect } from "react";
import { Group, Expense } from "@/config/types";
import * as groupServices from "@/services/groupServices";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";

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
  setSmartBalanceMode: React.Dispatch<React.SetStateAction<boolean>>;

  allBalances: any[];

  error: { status: number; message: string } | null;

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
  const [error, setError] = useState<{
    status: number;
    message: string;
  } | null>(null);

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

  const [actualBalances, setActualBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [netBalances, setNetBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [smartBalances, setSmartBalances] = useState<any[]>([]);

  // Fetch group data without processing balances
  const fetchGroupData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groupData = await groupServices.fetchGroup(groupId);
      setGroup(groupData);

      // Set Smart Mode state from the group data
      setSmartBalanceMode(groupData.smartMode || false);

      const groupBalances = await groupServices.fetchGroupBalances(groupId);
      console.log({ groupBalances });

      const expensesData = await groupServices.fetchExpenses(groupId);
      setExpenses(expensesData);

      // Process balances separately (will be called by the effect)
      processBalances(expensesData);
    } catch (error: any) {
      setError({
        status: error.response?.status || 500,
        message: extractErrorMessage(error) || "Failed to fetch group data",
      });
      console.error("Error fetching group data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setSmartBalanceMode(group.smartMode || false);
    }
  }, [group]);

  // Process balances separately based on current state
  const processBalances = useCallback(
    (expensesData: Expense[] = expenses) => {
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
        const response = await groupServices.createExpense(
          expenseData,
          groupId
        );
        toast.success(response.data.message);

        await fetchGroupData(); // Need to fetch after adding an expense
      } catch (error) {
        toast.error(extractErrorMessage(error));
        console.error("Error creating expense:", error);
      }
    },
    [groupId, fetchGroupData]
  );

  const handleUpdateExpense = useCallback(
    async (expenseId: string, updatedData: any) => {
      try {
        const response = await groupServices.updateExpense(
          expenseId,
          updatedData
        );
        toast.success(response.data.message);
        await fetchGroupData(); // Need to fetch after updating an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to update expense");
      }
    },
    [fetchGroupData]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string, currentUserId: string) => {
      try {
        const response = await groupServices.deleteExpense(
          expenseId,
          currentUserId
        );
        toast.success(response.data.message);
        await fetchGroupData(); // Need to fetch after deleting an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to delete expense");
      }
    },
    [fetchGroupData]
  );

  const handleJoinExpense = useCallback(
    async (expenseId: string) => {
      try {
        const response = await groupServices.joinExpense(
          expenseId,
          currentUserId
        );
        toast.success(response.data.message);
        await fetchGroupData(); // Need to fetch after joining an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to join expense");
      }
    },
    [currentUserId, fetchGroupData]
  );

  const handleLeaveExpense = useCallback(
    async (expenseId: string) => {
      try {
        const response = await groupServices.leaveExpense(
          expenseId,
          currentUserId
        );
        toast.success(response.data.message);
        await fetchGroupData(); // Need to fetch after leaving an expense
      } catch (error) {
        toast.error(extractErrorMessage(error) || "Failed to leave expense");
      }
    },
    [currentUserId, fetchGroupData]
  );

  const leaveGroup = useCallback(async () => {
    try {
      const response = await groupServices.leaveGroup(groupId, currentUserId);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to leave group");
    }
  }, [groupId, currentUserId]);

  const deleteGroup = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await groupServices.deleteGroup(groupId);
      toast.success(response.data.message);
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

  // ------------------------------------------------------------

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
    setSmartBalanceMode,
    error,
  };
};
