import React from "react";
import { Group } from "../../config/types";

interface BalanceCardProps {
  title: string;
  balances: any[];
  group: Group;
  currentUserId: string;
  smartBalanceMode: boolean;
  type: "receive" | "pay" | "all";
  handleMarkAsPaid?: (userId: string, amount: number) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  balances,
  group,
  currentUserId,
  smartBalanceMode,
  type,
  handleMarkAsPaid,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div
      className={`${
        type === "receive"
          ? "bg-green-50"
          : type === "pay"
          ? "bg-blue-50"
          : "bg-gray-50"
      } px-4 py-3 border-b border-gray-200`}
    >
      <h4 className="font-medium text-gray-800">{title}</h4>
    </div>
    <div className="divide-y divide-gray-100">
      {balances.length > 0 ? (
        balances.map((balance, index) => {
          const fromUser = group.members.find((m) => m._id === balance.from);
          const toUser = group.members.find((m) => m._id === balance.to);

          if (!fromUser || !toUser) return null;

          return (
            <div
              key={`${type}-${index}`}
              className="p-4 flex justify-between items-center"
            >
              <div className="flex items-center">
                <span className="font-medium">
                  {type === "receive" ? fromUser.name : toUser.name}
                </span>
                {smartBalanceMode && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    Smart
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-800 font-medium">
                  ₹{balance.amount.toFixed(2)}
                </span>
                {type === "pay" && handleMarkAsPaid && (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition duration-200"
                    onClick={() => handleMarkAsPaid(balance.to, balance.amount)}
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-4 text-center text-gray-500">
          {type === "receive"
            ? "No one needs to pay you anything"
            : type === "pay"
            ? "You are all settled up!"
            : "Everyone is settled up! No balances due."}
        </div>
      )}
    </div>
  </div>
);

export default BalanceCard;
