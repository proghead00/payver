import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Payver</h1>
      <div className="space-x-4">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Home
        </Link>
        <Link href="/register" className="text-gray-600 hover:text-gray-900">
          Register
        </Link>
        <Link href="/login" className="text-gray-600 hover:text-gray-900">
          Login
        </Link>
      </div>
    </nav>
  );
}
