/**
 * Generates a UPI deep link for payment
 * @param {string} upiId - Recipient's UPI virtual payment address
 * @param {number} amount - Payment amount
 * @param {string} recipientName - Recipient's name
 * @param {string} transactionId - Unique transaction identifier
 * @returns {string} UPI deep link
 */
export const generateUPILink = (
  upiId: string,
  amount: number,
  recipientName: string,
  transactionId: string
): string => {
  const formattedAmount = amount.toFixed(2);

  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    recipientName
  )}&am=${formattedAmount}&tid=${transactionId}&cu=INR`;
};

/**
 * Generates a unique transaction ID
 * @param {string} groupId - Group ID
 * @param {string} fromUserId - Payer's user ID
 * @param {string} toUserId - Recipient's user ID
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = (
  groupId: string,
  fromUserId: string,
  toUserId: string
) => {
  // Ensure all inputs are valid strings
  if (!groupId || !fromUserId || !toUserId) {
    throw new Error(
      "Invalid input: groupId, fromUserId, and toUserId are required"
    );
  }

  const timestamp = Date.now();
  return `TR-${groupId.substring(0, 8)}-${fromUserId.substring(
    0,
    6
  )}-${toUserId.substring(0, 6)}-${timestamp}`;
};
/**
 * Formats the amount to 2 decimal places
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount: number) => {
  return amount.toFixed(2);
};
