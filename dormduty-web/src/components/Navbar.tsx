"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, ClipboardList, Home, LogOut, WashingMachine, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Tasks", href: "/tasks", icon: ClipboardList },
  { name: "Laundry", href: "/laundry", icon: WashingMachine },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Split", href: "/split", icon: Wallet },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full border-t border-gray-200 bg-white/80 backdrop-blur-md shadow-inner z-50">
      <div className="mx-auto flex max-w-4xl items-center justify-around gap-6 py-3">
        {tabs.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={name}
              href={href}
              className={`flex flex-col items-center text-sm font-medium transition ${
                active ? "text-blue-600" : "text-gray-700 hover:text-blue-500"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${
                  active ? "scale-110 text-blue-600" : "text-gray-500"
                }`}
              />
              <span className="mt-1">{name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center text-sm font-medium text-gray-700 transition hover:text-red-500"
        >
          <LogOut className="h-5 w-5 text-gray-500 transition group-hover:text-red-500" />
          <span className="mt-1">Logout</span>
        </button>
      </div>
    </nav>
  );
}
