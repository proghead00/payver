import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";
import * as crypto from "crypto";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

// Extend Request interface to include `userId`
interface AuthRequest extends Request {
  userId?: string; // Add the userId to request type
}

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, upiId } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user with UPI ID
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      upiId,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    console.log("Generated Token:", token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify the token and decode the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    // Fetch the user and exclude the password field
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Fetch the user's groups and populate the necessary fields
    const groups = await Group.find({ members: user._id })
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .populate("expenses");

    // Fetch the user's expenses (only the ones paid by them)
    const expenses = await Expense.find({ paidBy: user._id })
      .populate("paidBy", "name email")
      .populate("group", "name");

    res.json({
      user,
      groups,
      expenses,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire the cookie immediately
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailSubject = "Payver - Reset Your Password";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; text-align: center;">🔑 Password Reset Request</h2>
        <p style="color: #555;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #555;">We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #777; font-size: 14px;">If you did not request this, you can ignore this email.</p>
        <p style="color: #777; font-size: 14px;">Cheers, <br><strong>Payver</strong></p>
      </div>
    `;
    const emailText = `Hello ${user.name},\n\nWe received a request to reset your password. Click the link below:\n\n${resetLink}\n\nIf you didn't request this, ignore this email.\n\nCheers,\nPayver Team`;

    await sendEmail(user.email, emailSubject, emailHtml, emailText);

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    // Find user by reset token and check expiration
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserUpiId = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("upiId");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, upiId: user.upiId });
  } catch (error) {
    console.error("Error fetching user UPI ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
