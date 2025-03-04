import express from "express";
import {
  confirmPaymentReceived,
  createExpense,
  deleteExpense,
  getExpenseById,
  getGroupBalances,
  getPendingPaymentNotifications,
  getSimplifiedBalances,
  joinExpense,
  leaveExpense,
  markPaymentAsCompleted,
  removeExpenseMember,
  updateExpense,
} from "../controllers/expenseController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", checkAuth, createExpense);
router.get("/:id", checkAuth, getExpenseById);
router.put("/:id", checkAuth, updateExpense);
router.delete("/:id", checkAuth, deleteExpense);
router.post("/join/:id", checkAuth, joinExpense);

router.get("/balances/:id", getGroupBalances);

router.post("/leave/:id", checkAuth, leaveExpense);
router.post("/remove/:id", checkAuth, removeExpenseMember);

router.post("/payment-completed", markPaymentAsCompleted);
router.get("/notifications/:userId", getPendingPaymentNotifications);

router.post("/confirm-payment", confirmPaymentReceived);

router.get("/simplified-balances/:groupId", checkAuth, getSimplifiedBalances);

export default router;
