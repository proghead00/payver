export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface SplitDetail {
  user: string; // This is just the ID from the API
  amount: number;
  _id: string;
}

interface ExpenseType {
  _id: string;
  description: string;
  amount: number;
  paidBy: User;
  splitDetails: SplitDetail[];
}

interface GroupDetailsProps {
  group: Group | null;
  expenses: ExpenseType[];
  handlePayment: (amount: number, userId: string) => void;
  handleAddExpense: (expenseData: any) => Promise<void>;
  currentUserId: string;
  fetchGroupData: () => void;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  paidBy: {
    _id: string;
    name: string;
  };
  group: {
    _id: string;
    name: string;
  };
  splitDetails: Array<{
    user: string | { _id: string; name: string };
    amount: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Group {
  _id: string;
  name: string;
  members: User[];
}
