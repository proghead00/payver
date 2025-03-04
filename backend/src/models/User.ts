import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  resetToken?: string;
  upiId?: string;
  resetTokenExpires?: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String, default: null },
    upiId: { type: String },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
