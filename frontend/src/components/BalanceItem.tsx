const BalanceItem = ({
  fromUser,
  toUser,
  amount,
  originalAmount,
  currentUserId,
  smartBalanceMode,
}: {
  fromUser: any;
  toUser: any;
  amount: number;
  originalAmount: number;
  currentUserId: string;
  smartBalanceMode: boolean;
}) => {
  const isUserOwing = currentUserId === fromUser._id;
  const isUserReceiving = currentUserId === toUser._id;

  // Don't render if current user is not involved
  if (!isUserOwing && !isUserReceiving) return null;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="font-medium text-gray-700">
          {isUserOwing ? "Money You Owe" : "Money Owed to You"}
        </h4>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-gray-800">
              {isUserOwing ? (
                <span>
                  You owe <span className="font-medium">{toUser.name}</span>
                </span>
              ) : (
                <span>
                  <span className="font-medium">{fromUser.name}</span> owes you
                </span>
              )}
            </div>

            <div className="ml-3 text-lg font-semibold text-blue-600">
              ₹{amount.toFixed(2)}
            </div>

            {smartBalanceMode && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Smart Balance
              </span>
            )}
          </div>

          {isUserOwing ? (
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition duration-200">
              Mark as Paid
            </button>
          ) : (
            <span className="text-amber-600 text-sm font-medium">Pending</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceItem;
