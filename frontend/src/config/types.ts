export interface User {
  _id: string;
  name: string;
  email: string;
}

interface IEditHistory {
  name?: string;
  editedBy: string;
  timestamp: string;
  changes: {
    field: string; // Field name changed
    oldValue: any; // Previous value
    newValue: any; // Updated value
  }[];
  reason?: string; // Optional reason for edit
}
interface ISplit {
  user: string | User; // Can be a string (user ID) or a User object
  amount: number; // How much they owe
  completedPaymentByOwer?: boolean; // Marked as paid by payer
  paymentConfirmedByReceiver?: boolean; // Confirmed by recipient
  _id?: string;
}

interface ExpenseType {
  _id: string;
  description: string;
  amount: number;
  paidBy: User;
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
  splitDetails: ISplit[];
  editHistory: IEditHistory[];

  createdAt?: string;
  updatedAt?: string;
  date: Date;
  __v?: number;
}

export interface Group {
  smartMode?: boolean;
  _id: string;
  name: string;
  admin?: boolean | string;
  members: User[];
  expenses: Expense[];
  createdBy?: { _id: string };
  picture?: string;
}
