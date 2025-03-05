export const generateUPILink = (payeeVPA, amount, name, transactionId) => {
    const encodedName = encodeURIComponent(name);
    const encodedTransactionId = encodeURIComponent(transactionId);
    return `upi://pay?pa=${payeeVPA}&pn=${encodedName}&am=${amount}&tr=${encodedTransactionId}&cu=INR`;
};
