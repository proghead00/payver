import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";

interface AuthRequest extends Request {
  userId?: string; // Extend the Request interface to include userId
}

export const checkAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log({ error });
    res.status(401).json({ message: "Invalid token" });
  }
};
