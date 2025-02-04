import "@/styles/globals.css";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        <ToastContainer />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
