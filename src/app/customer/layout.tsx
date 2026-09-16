import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/customer" className="flex items-center gap-3 group">
            <div data-testid="customer-logo" className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-lg group-hover:shadow-blue-300 transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">TeleConnect</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/customer" data-testid="nav-dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/customer/orders" data-testid="nav-orders" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              My Orders
            </Link>
            <Link href="/customer/order" data-testid="nav-new-order" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              New Order
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700" data-testid="user-name">{user.name}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">© 2024 TeleConnect Broadband Services</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">Support: 1800-123-4567</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
