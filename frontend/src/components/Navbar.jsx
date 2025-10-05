import React from "react";
import { useSplitManager } from "../hooks/useSplitManager";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  ClipboardList,
  WashingMachine,
  Wallet,
  User,
} from "lucide-react";

const tabs = [
  { name: "Home", to: "/home", Icon: HomeIcon },
  { name: "Tasks", to: "/tasks", Icon: ClipboardList },
  { name: "Laundry", to: "/laundry", Icon: WashingMachine },
  { name: "Split", to: "/split", Icon: Wallet },
  { name: "Profile", to: "/profile", Icon: User },
];

const Navbar = () => {
  const { state } = useSplitManager();
  const { user: authUser } = useAuth();
  const currentUser = authUser
    ? state.users.find((u) => u.email === authUser.email) || state.users[0]
    : state.users[0];
  const ProfileIcon = () => {
    const avatar = currentUser?.avatar;
    const base = "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold border";
    if (avatar && /^(https?:|data:)/.test(avatar)) {
      return <img src={avatar} alt="me" className={`${base} border-gray-200`} />;
    }
    const content = avatar || (currentUser?.name || "?").charAt(0);
    return <span className={`${base} bg-gray-100 text-gray-600 border-gray-200`}>{content}</span>;
  };
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
              {name === "Profile" ? (
                <ProfileIcon />
              ) : (
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-blue-600" : "text-gray-500"
                  }`}
                />
              )}
              <span className="mt-1">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
