import { Server } from "socket.io";
import { setupWebSocket } from "./socketHandler.js";

export const initializeWebSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupWebSocket(io);
};
