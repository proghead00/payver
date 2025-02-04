import express, { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUser,
} from "../controllers/authController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", checkAuth, getUser);

export default router;
