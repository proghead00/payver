import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getGroupBalances,
  joinExpense,
  updateExpense,
} from "../controllers/expenseController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Expense routes
router.post("/create", checkAuth, createExpense);
router.get("/:id", checkAuth, getExpenseById);
router.put("/:id", checkAuth, updateExpense);
router.delete("/:id", checkAuth, deleteExpense);
router.post("/join/:id", checkAuth, joinExpense);

router.get("/balances/:id", checkAuth, getGroupBalances);

export default router;
