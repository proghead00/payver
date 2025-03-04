import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  upiId?: string;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    upiId: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
