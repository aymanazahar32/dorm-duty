/**
 * HYBRID AUTH CONTEXT - Combines Anan's Supabase auth with Ayman's API integration
 * 
 * Features:
 * - Full Supabase authentication (magic link + password)
 * - Automatic backend registration via /api/registerUser
 * - User object format compatible with Ayman's API client
 * - Session persistence
 * 
 * User object structure:
 * {
 *   id: "supabase-uuid",      // For API calls
 *   roomId: "room-123",       // From backend
 *   email: "user@email.com",
 *   name: "User Name"
 * }
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { apiFetch } from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        // Try to load user from localStorage
        const storedUser = localStorage.getItem("smartdorm_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse stored user:", e);
          }
        }
      }
      
      setLoading(false);
    });

    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth event:", event);
      setSession(session);
      
      if (session) {
        // User logged in - register with backend
        await handleUserRegistration(session.user);
      } else {
        // User logged out - clear data
        setUser(null);
        localStorage.removeItem("smartdorm_user");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register or fetch user from backend after Supabase authentication
   * This ensures we have roomId and other backend data
   */
  const handleUserRegistration = async (supabaseUser) => {
    try {
      console.log("📞 Calling /api/registerUser...");
      
      const payload = await apiFetch("/api/registerUser", {
        method: "POST",
        body: {
          email: supabaseUser.email,
          userId: supabaseUser.id,
          name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split("@")[0] ||
            "Roommate",
        },
      });

      // API may return either { data: {...} } or { user: {...} }
      const responseUser =
        payload?.user ??
        payload?.data ??
        payload ??
        {};

      const userPayload = {
        id: responseUser.id ?? supabaseUser.id,
        roomId: responseUser.room_id ?? responseUser.roomId ?? null,
        email: responseUser.email ?? supabaseUser.email,
        name:
          responseUser.name ??
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.email?.split("@")[0] ??
          "Roommate",
      };

      setUser(userPayload);
      localStorage.setItem("smartdorm_user", JSON.stringify(userPayload));

      console.log("✅ User registered:", userPayload);
      return userPayload;
    } catch (error) {
      console.error("❌ Error registering user:", error);
      
      // Fallback: use Supabase data only
      const fallbackUser = {
        id: supabaseUser.id,
        roomId: null,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "Roommate",
      };
      
      setUser(fallbackUser);
      localStorage.setItem("smartdorm_user", JSON.stringify(fallbackUser));
      
      return fallbackUser;
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
            full_name: name,
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
   * Logout user - clears Supabase session and local data
   */
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("smartdorm_user");
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Update user profile (for compatibility with Ayman's code)
   * Updates local user object and persists to localStorage
   */
  const updateProfile = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("smartdorm_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    // User data (compatible with Ayman's API client)
    user,                         // { id, roomId, email, name }
    session,                      // Supabase session (for JWT)
    
    // Auth status
    isAuthenticated: !!session && !!user,
    loading,
    
    // Auth methods
    login,                        // Email/password login
    signUp,                       // Create account
    sendMagicLink,                // Passwordless login
    logout,                       // Sign out
    updateProfile,                // Update user fields
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
