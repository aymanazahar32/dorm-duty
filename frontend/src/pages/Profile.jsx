import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Home, 
  Copy, 
  Check, 
  LogOut, 
  Settings,
  Shield
} from "lucide-react";

/**
 * Profile Page
 * Shows user information, IDs, and account management
 */
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } else {
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/auth");
  };

  const goToRoomSetup = () => {
    navigate("/room-setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <User className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.name || "Your Profile"}
          </h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        {/* Profile Cards */}
        <div className="space-y-4">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Account Information
            </h2>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800">
                  {user?.email}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Display Name
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800">
                  {user?.name}
                </div>
              </div>
            </div>
          </div>

          {/* User ID Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-indigo-200">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">
              Supabase User ID
            </h2>
            <p className="text-sm text-indigo-700 mb-4">
              Your unique identifier for API calls
            </p>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={user?.id || "Not available"}
                readOnly
                className="flex-1 bg-white border border-indigo-300 rounded-lg px-4 py-3 text-sm font-mono text-gray-700"
              />
              <button
                onClick={() => copyToClipboard(user?.id, "userId")}
                className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
                title="Copy User ID"
              >
                {copiedUserId ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Room ID Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Room ID
            </h2>
            <p className="text-sm text-purple-700 mb-4">
              {user?.roomId 
                ? "Your dorm room identifier - share this with roommates!" 
                : "You haven't joined a room yet"}
            </p>
            
            {user?.roomId ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.roomId}
                  readOnly
                  className="flex-1 bg-white border border-purple-300 rounded-lg px-4 py-3 text-sm font-mono text-gray-700"
                />
                <button
                  onClick={() => copyToClipboard(user.roomId, "roomId")}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
                  title="Copy Room ID"
                >
                  {copiedRoomId ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={goToRoomSetup}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Set Up Room
              </button>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={goToRoomSetup}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                {user?.roomId ? "Change Room" : "Join or Create Room"}
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 About Your IDs
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>User ID</strong>: Your personal Supabase authentication identifier</li>
              <li>• <strong>Room ID</strong>: Links you to your dorm and roommates</li>
              <li>• Share your Room ID with roommates so they can join your dorm</li>
              <li>• These IDs are used by the backend to fetch your chore data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
