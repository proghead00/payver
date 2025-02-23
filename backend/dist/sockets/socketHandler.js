export const setupWebSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);
        // Join a specific group room
        socket.on("joinGroup", (groupId) => {
            socket.join(groupId);
            console.log(`User ${socket.id} joined group ${groupId}`);
        });
        // Broadcast when a new expense is added
        socket.on("newExpense", (groupId, expense) => {
            io.to(groupId).emit("expenseAdded", expense);
            console.log(`New expense added to group ${groupId}`);
        });
        // Broadcast when a new member joins
        socket.on("newMember", (groupId, member) => {
            io.to(groupId).emit("memberJoined", member);
            console.log(`New member joined group ${groupId}`);
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
};
