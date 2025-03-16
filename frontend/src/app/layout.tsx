import "@/styles/globals.css";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "@/components/ui/sonner";
import { CustomToaster } from "@/components/ui/CustomToaster";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <Navbar />
        <CustomToaster />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
