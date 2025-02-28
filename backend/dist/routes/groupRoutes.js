import express from "express";
import { createGroup, joinGroup, getGroupDetails, getExpensesByGroup, deleteGroup, leaveGroup, } from "../controllers/groupController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();
// Group routes
router.post("/create", checkAuth, createGroup);
router.post("/join", checkAuth, joinGroup);
router.get("/:id", checkAuth, getGroupDetails);
router.get("/expenses/:groupId", checkAuth, getExpensesByGroup);
router.delete("/:id", checkAuth, deleteGroup);
router.post("/leave/:id", checkAuth, leaveGroup);
// router.post("/remove/:id", checkAuth, removeExpenseMember);
export default router;
