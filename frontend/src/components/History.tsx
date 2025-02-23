import React from "react";

const History = ({ history }: { history: any[] }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      {history.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul>
          {history.map((payment) => (
            <li key={payment._id} className="mb-2">
              <p>
                {payment.fromUser.name} paid ${payment.amount.toFixed(2)} to{" "}
                {payment.toUser.name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(payment.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
