import { Request } from "express";
import { FileArray } from "express-fileupload";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      files?: FileArray;
    }
  }
}
