// import React from "react";
// import { Expense, Group } from "../../config/types";
// import ExpenseItem from "./ExpenseItem/ExpenseItem";

// interface ExpensesSectionProps {
//   expenses: Expense[];
//   group: Group;
//   currentUserId: string;
//   selectedExpenseId: string | null;
//   setSelectedExpenseId: (id: string) => void;
//   handleUpdateExpense: (expenseId: string, updatedData: any) => Promise<void>;
//   handleDeleteExpense: (expenseId: string) => Promise<void>;
//   handleJoinExpense: (expenseId: string) => Promise<void>;
//   handleLeaveExpense: (expenseId: string) => Promise<void>;
// }

// const ExpensesSection: React.FC<ExpensesSectionProps> = ({
//   expenses,
//   group,
//   currentUserId,
//   selectedExpenseId,
//   setSelectedExpenseId,
//   handleUpdateExpense,
//   handleDeleteExpense,
//   handleJoinExpense,
//   handleLeaveExpense,
// }) => {
//   return (
//     <div>
//       <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-800">
//         Recent Expenses
//       </h3>
//       {expenses.length > 0 ? (
//         <div className="space-y-4">
//           {expenses.map((expense) => (
//             <ExpenseItem
//               key={expense._id}
//               expense={expense}
//               currentUserId={currentUserId}
//               users={group.members}
//               handleUpdateExpense={handleUpdateExpense}
//               handleDeleteExpense={handleDeleteExpense}
//               handleJoinExpense={handleJoinExpense}
//               isSelected={selectedExpenseId === expense._id}
//               onSelect={() => setSelectedExpenseId(expense._id)}
//               handleLeaveExpense={handleLeaveExpense}
//               group={group}
//             />
//           ))}
//         </div>
//       ) : (
//         <p className="text-center text-gray-500 py-4">
//           No expenses recorded yet.
//         </p>
//       )}
//     </div>
//   );
// };

// export default ExpensesSection;
