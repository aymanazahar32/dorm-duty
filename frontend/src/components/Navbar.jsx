import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  ClipboardList,
  WashingMachine,
  Wallet,
} from "lucide-react";

const tabs = [
  { name: "Home", to: "/home", Icon: HomeIcon },
  { name: "Tasks", to: "/tasks", Icon: ClipboardList },
  { name: "Laundry", to: "/laundry", Icon: WashingMachine },
  { name: "Split", to: "/split", Icon: Wallet },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-inner z-50">
      <div className="flex justify-around py-3 max-w-4xl mx-auto">
        {tabs.map(({ name, to, Icon }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={name}
              to={to}
              className={`flex flex-col items-center text-sm font-medium transition ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-500"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 text-blue-600" : "text-gray-500"
                }`}
              />
              <span className="mt-1">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
