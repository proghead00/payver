import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "../controllers/expenseController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Expense routes
router.post("/create", checkAuth, createExpense);
router.get("/:id", checkAuth, getExpenseById);
router.put("/:id", checkAuth, updateExpense);
router.delete("/:id", checkAuth, deleteExpense);

export default router;
