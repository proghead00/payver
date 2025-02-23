import axios from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/utils/errorHandler";
import { useEffect, useState } from "react";

export const useGroupPageLogic = (groupId: string) => {
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch group details and expenses
  const fetchGroupData = async () => {
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
    } catch (error) {
      toast.error(extractErrorMessage(error));
      console.error("Error fetching group data:", error);
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expense/create`,
        { ...expenseData, group },
        { withCredentials: true }
      );
      toast.success(response.data);
      await fetchGroupData(); // Refresh data after adding expense
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/leave/${groupId}`,
        { currentUserId },
        { withCredentials: true }
      );

      toast.success(response.data);
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/group/${groupId}`,
        { withCredentials: true }
      );
      toast.success(response.data);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(extractErrorMessage(error) || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
    const curUserId = localStorage.getItem("userId") as string;
    setCurrentUserId(curUserId);
  }, [groupId]);

  return {
    group,
    expenses,
    history,
    currentUserId,
    isDeleting,
    fetchGroupData,
    handleAddExpense,
    handleLeaveGroup,
    handleDeleteGroup,
  };
};
