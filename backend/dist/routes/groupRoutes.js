import express from "express";
import { createGroup, joinGroup, getGroupDetails, getExpensesByGroup, } from "../controllers/groupController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();
// Group routes
router.post("/create", checkAuth, createGroup);
router.post("/join", checkAuth, joinGroup);
router.get("/:id", checkAuth, getGroupDetails);
router.get("/expenses/:groupId", checkAuth, getExpensesByGroup);
export default router;
