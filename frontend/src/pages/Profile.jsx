import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Home, 
  LogOut, 
  Settings,
  Phone,
  DollarSign,
  Loader2,
  Bell,
  Sun,
  Moon,
  Camera,
  Sparkles
} from "lucide-react";

/**
 * Profile Page
 * Shows user information, IDs, and account management
 */
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState(user?.name || "");
  const [nickname, setNickname] = useState("");
  const [statusMessage, setStatusMessage] = useState("Available for chores today");
  const [bio, setBio] = useState("Let your roommates know a bit about you.");
  const [zelleContact, setZelleContact] = useState("");
  const [theme, setTheme] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  
  // Ref for file input
  const fileInputRef = React.useRef(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/auth");
  };

  const goToRoomSetup = () => {
    navigate("/room-setup");
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || "U"
                  )}
                </div>
                <button 
                  onClick={handleImageClick}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-lg cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600">{user?.name || "User"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Basic Info
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Managed via your login account.</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-700">
                    {user?.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Room / Dorm
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-700">
                    {user?.roomId || "—"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Status message
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all resize-none"
                  placeholder="Share a quick intro or reminder for roommates."
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    <button className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-all">
                      😊
                    </button>
                    <button className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-all">
                      😎
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                Save Info
              </button>
            </div>
          </div>

          {/* Snapshot Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-200/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Snapshot
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-blue-900">Room: <span className="text-blue-700">{user?.roomId || "—"}</span></p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Status: <span className="text-blue-700">{statusMessage || "—"}</span></p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Bio: <span className="text-blue-700">{bio}</span></p>
              </div>
            </div>
          </div>

          {/* Zelle Contact Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Zelle contact
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Zelle (email or phone)
                </label>
                <input
                  type="text"
                  value={zelleContact}
                  onChange={(e) => setZelleContact(e.target.value)}
                  placeholder="e.g., +1 555 123 4567"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Roommates will use this contact in the Split payment drawer.
                </p>
              </div>
              
              <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all">
                Save
              </button>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Recent Payments</h3>
                <p className="text-sm text-gray-500">No payments yet.</p>
              </div>
            </div>
          </div>

          {/* Notifications & Theme Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Notifications & theme
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Task & laundry notifications</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationsEnabled(true)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      notificationsEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Enable
                  </button>
                  <button
                    onClick={() => setNotificationsEnabled(false)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      !notificationsEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Disable
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Theme preference</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      theme === 'light'
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-white border-2 border-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 pt-2">
                Preferences apply only to your account and will sync the next time you sign in.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Activity overview
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Tasks completed</p>
              <p className="text-3xl font-bold text-blue-900">0</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium mb-1">Payments made</p>
              <p className="text-3xl font-bold text-emerald-900">0</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs text-purple-600 font-medium mb-1">Upcoming laundry</p>
              <p className="text-3xl font-bold text-purple-900">3</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-4">
              <p className="text-xs text-pink-600 font-medium mb-1">Aura points</p>
              <p className="text-3xl font-bold text-pink-900">0</p>
            </div>
          </div>
        </div>

        {/* Bottom Grid - Laundry & Split */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Laundry Schedule */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-purple-600" />
              My laundry schedule
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Washer Machine</p>
                  <p className="text-xs text-gray-500">10/5/2025, 5:55:00 AM → 6:40 AM</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Reserved
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Washer Machine</p>
                  <p className="text-xs text-gray-500">10/5/2025, 6:13:00 AM → 6:58 AM</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Reserved
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Washer Machine</p>
                  <p className="text-xs text-gray-500">10/5/2025, 6:13:00 AM → 6:58 AM</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Reserved
                </span>
              </div>
            </div>
          </div>

          {/* Split Summary */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Split summary
            </h2>
            
            <div className="flex items-center justify-between py-4">
              <p className="text-sm font-medium text-gray-700">Roommates</p>
              <p className="text-lg font-bold text-emerald-600">+0.00</p>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Actions
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={goToRoomSetup}
              className="w-full py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 rounded-xl font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center gap-2 border-2 border-blue-200"
            >
              <Home className="w-5 h-5" />
              {user?.roomId ? "Change Room" : "Join or Create Room"}
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl font-semibold hover:from-red-100 hover:to-pink-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-2 border-red-200"
            >
              <LogOut className="w-5 h-5" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
