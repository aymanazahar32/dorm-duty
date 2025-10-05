import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home, Plus, Users, Copy, Check, AlertCircle, Link2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

/**
 * Room Setup Page
 * Allows users to create a new room or join an existing one
 * Shows user's Supabase ID and room ID for debugging/testing
 */
export default function RoomSetup() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("choice"); // 'choice', 'create', 'join'
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [searchParams] = useSearchParams();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

  // Check for invitation link parameter
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode && !user?.roomId) {
      setRoomCode(inviteCode);
      setMode('join');
    }
  }, [searchParams, user?.roomId]);

  // Redirect if user already has a room
  useEffect(() => {
    if (user?.roomId) {
      // User already has a room, show option to continue or change
      setMode("hasRoom");
    }
  }, [user?.roomId]);

  const generateInviteLink = (roomId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/room-setup?invite=${roomId}`;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("🔵 Starting room creation...");
      console.log("🔵 User object:", user);
      console.log("🔵 API_BASE_URL:", API_BASE_URL);
      
      // Get Supabase auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("🔵 Session data:", session);
      console.log("🔵 Session error:", sessionError);
      
      const token = session?.access_token;

      if (!token) {
        console.error("❌ No auth token found!");
        console.error("Session:", session);
        throw new Error("Not authenticated. Please log out and log back in.");
      }

      console.log("✅ Auth token found (length):", token.length);
      console.log("🔵 Token preview:", token.substring(0, 50) + "...");

      console.log("🔵 Making request to:", `${API_BASE_URL}/api/rooms`);
      console.log("🔵 Request body:", { name: roomName, createdBy: user.id });

      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName,
          createdBy: user.id,
        }),
      });

      console.log("🔵 Response status:", response.status);
      console.log("🔵 Response ok:", response.ok);

      const responseText = await response.text();
      console.log("🔵 Response text:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        console.error("❌ API Error:", errorData);
        
        if (response.status === 401) {
          throw new Error(`Authentication failed: ${errorData.error || "Invalid token"}. Please log out and log back in.`);
        } else if (response.status === 403) {
          throw new Error(`Permission denied: ${errorData.error || "Forbidden"}`);
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorData.error || "Internal server error"}. Details: ${errorData.details || "Unknown"}`);
        } else {
          throw new Error(`Failed to create room (${response.status}): ${errorData.error || errorData.details || "Unknown error"}`);
        }
      }

      const data = JSON.parse(responseText);
      console.log("✅ Room created successfully:", data);
      
      const newRoomId = data.roomId || data.id;

      // Update user's roomId
      await updateUserRoom(newRoomId);

      // Store the created room ID to show invitation link
      setCreatedRoomId(newRoomId);
      setSuccess(`Room "${roomName}" created successfully!`);
    } catch (err) {
      console.error("❌ Error in handleCreateRoom:", err);
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get Supabase auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // First, verify the room exists
      const checkResponse = await fetch(`${API_BASE_URL}/api/rooms?roomId=${roomCode}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!checkResponse.ok) {
        throw new Error("Room not found. Please check the room code.");
      }

      // Update user's roomId
      await updateUserRoom(roomCode);

      setSuccess(`Successfully joined room!`);
      
      // Redirect to home after 2 seconds
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      setError(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoom = async (newRoomId) => {
    try {
      // Get Supabase auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Update in backend
      const response = await fetch(`${API_BASE_URL}/api/user/${user.id}/room`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: newRoomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user room");
      }

      // Update in local context
      updateProfile({ roomId: newRoomId });
    } catch (err) {
      throw new Error("Failed to update room assignment");
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } else if (type === "roomId") {
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } else if (type === "inviteLink") {
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 2000);
    }
  };

  const goToHome = () => {
    navigate("/home");
  };

  // User already has a room
  if (mode === "hasRoom" && user?.roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Home className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              You're All Set! 🎉
            </h1>
            <p className="text-gray-600">
              You're already part of a room. Here are your details:
            </p>
          </div>

          {/* User Info Cards */}
          <div className="space-y-4 mb-6">
            {/* User ID Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-indigo-900 mb-2 block">
                Your Supabase User ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.id}
                  readOnly
                  className="flex-1 bg-white border border-indigo-300 rounded px-3 py-2 text-sm font-mono text-gray-700"
                />
                <button
                  onClick={() => copyToClipboard(user.id, "userId")}
                  className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  title="Copy User ID"
                >
                  {copiedUserId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Room ID Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-purple-900 mb-2 block">
                Your Room ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.roomId}
                  readOnly
                  className="flex-1 bg-white border border-purple-300 rounded px-3 py-2 text-sm font-mono text-gray-700"
                />
                <button
                  onClick={() => copyToClipboard(user.roomId, "roomId")}
                  className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  title="Copy Room ID"
                >
                  {copiedRoomId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Invitation Link Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-emerald-900 mb-2 block">
                Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generateInviteLink(user.roomId)}
                  readOnly
                  className="flex-1 bg-white border border-emerald-300 rounded px-3 py-2 text-sm text-gray-700 truncate"
                />
                <button
                  onClick={() => copyToClipboard(generateInviteLink(user.roomId), "inviteLink")}
                  className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                  title="Copy Invitation Link"
                >
                  {copiedInviteLink ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-emerald-700 mt-2">
                Share this link with roommates - they can click it to join automatically!
              </p>
            </div>

            {/* Email */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Your Email
              </label>
              <div className="text-gray-700">{user.email}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={goToHome}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
            <button
              onClick={() => setMode("choice")}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Change Room
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            💡 Share the invitation link above with roommates for easy one-click joining!
          </p>
        </div>
      </div>
    );
  }

  // Choice screen
  if (mode === "choice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Home className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Room Setup
            </h1>
            <p className="text-gray-600">
              Create a new room or join an existing one
            </p>
          </div>

          {/* User Info Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-xs font-semibold text-blue-900 mb-2">Your User ID:</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white px-2 py-1 rounded border border-blue-300 truncate">
                {user?.id}
              </code>
              <button
                onClick={() => copyToClipboard(user?.id, "userId")}
                className="p-1 hover:bg-blue-200 rounded"
                title="Copy"
              >
                {copiedUserId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
              Create New Room
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Users className="w-6 h-6" />
              Join Existing Room
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            Welcome, <span className="font-semibold">{user?.name || user?.email}</span>!
          </p>
        </div>
      </div>
    );
  }

  // Create room form
  if (mode === "create") {
    // Show success screen with invitation link after room is created
    if (createdRoomId) {
      const inviteLink = generateInviteLink(createdRoomId);
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Room Created Successfully! 🎉
              </h1>
              <p className="text-gray-600">
                Share the details below with your roommates
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Room ID Card */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-purple-900 mb-2 block">
                  Room ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdRoomId}
                    readOnly
                    className="flex-1 bg-white border border-purple-300 rounded px-3 py-2 text-sm font-mono text-gray-700"
                  />
                  <button
                    onClick={() => copyToClipboard(createdRoomId, "roomId")}
                    className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                    title="Copy Room ID"
                  >
                    {copiedRoomId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Invitation Link Card - Highlighted */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-5 h-5 text-emerald-600" />
                  <label className="text-sm font-bold text-emerald-900">
                    Invitation Link (Recommended)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-white border border-emerald-300 rounded px-3 py-2 text-sm text-gray-700"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteLink, "inviteLink")}
                    className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition flex items-center gap-1 px-4"
                    title="Copy Invitation Link"
                  >
                    {copiedInviteLink ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="text-sm font-medium">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-emerald-700 mt-2 font-medium">
                  ✨ Send this link to roommates - they can join with just one click!
                </p>
              </div>
            </div>

            <button
              onClick={goToHome}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <button
            onClick={() => setMode("choice")}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Plus className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create New Room
            </h1>
            <p className="text-gray-600">
              Start a new room for your dorm
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Dorm 301, The Squad, etc."
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Choose a name that your roommates will recognize
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Room
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Join room form
  if (mode === "join") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <button
            onClick={() => setMode("choice")}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Join a Room
            </h1>
            <p className="text-gray-600">
              {searchParams.get('invite') 
                ? "Using invitation link - click Join to continue!"
                : "Enter the room code from your roommate"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter room ID"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                {searchParams.get('invite') 
                  ? "Room code auto-filled from invitation link"
                  : "Ask your roommate for the Room ID or invitation link"}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join Room
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
