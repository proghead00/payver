import express, { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
  resetPassword,
  forgotPassword,
  getUserUpiId,
} from "../controllers/authController.js";
import { checkAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working" });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", checkAuth, getUser);

router.get("/:userId/upiId", getUserUpiId);

export default router;
