import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

// Backend API URL - update this to match your backend
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create context
const AuthContext = createContext();

// Custom hook for using AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Load room/user IDs from localStorage if available
      if (session) {
        const storedRoomId = localStorage.getItem("dorm_room_id");
        const storedUserId = localStorage.getItem("dorm_user_id");
        setRoomId(storedRoomId);
        setUserId(storedUserId);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        // When user logs in, try to fetch or register user data
        await handleUserRegistration(session.user);
      } else {
        // Clear stored data on logout
        setRoomId(null);
        setUserId(null);
        localStorage.removeItem("dorm_room_id");
        localStorage.removeItem("dorm_user_id");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register or fetch user from backend after Supabase auth
   */
  const handleUserRegistration = async (supabaseUser) => {
    try {
      const response = await fetch(`${API_URL}/api/registerUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: supabaseUser.email,
          userId: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store room and user IDs
        if (data.roomId) {
          setRoomId(data.roomId);
          localStorage.setItem("dorm_room_id", data.roomId);
        }
        if (data.userId || data.id) {
          const userIdValue = data.userId || data.id;
          setUserId(userIdValue);
          localStorage.setItem("dorm_user_id", userIdValue);
        }
        
        console.log("User registered/fetched:", data);
      } else {
        console.error("Failed to register user:", await response.text());
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  /**
   * Send magic link for passwordless login
   */
  const sendMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin + "/home",
        },
      });

      if (error) throw error;

      return { success: true, message: "Magic link sent! Check your email." };
    } catch (error) {
      console.error("Magic link error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign in with email and password (traditional login)
   */
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: window.location.origin + "/home",
        },
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setUser(null);
      setSession(null);
      setRoomId(null);
      setUserId(null);
      localStorage.removeItem("dorm_room_id");
      localStorage.removeItem("dorm_user_id");

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update user room assignment
   */
  const updateRoom = (newRoomId) => {
    setRoomId(newRoomId);
    localStorage.setItem("dorm_room_id", newRoomId);
  };

  const value = {
    // User data
    user,
    session,
    userId,
    roomId,
    
    // Auth status
    isAuthenticated: !!session,
    loading,
    
    // Auth methods
    login,
    signUp,
    sendMagicLink,
    logout,
    
    // Utility methods
    updateRoom,
    handleUserRegistration,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
