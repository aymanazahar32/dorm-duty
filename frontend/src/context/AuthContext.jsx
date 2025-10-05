import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";

const STORAGE_KEY = "smartdorm_user";
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      } catch (err) {
        console.warn("Failed to parse stored user", err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setUser((prev) => {
        const next = {
          ...prev,
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            prev?.name ||
            session.user.email?.split("@")[0] ||
            "Roommate",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(({ email, password, userId, roomId, name }) => {
    const normalizedName = name?.trim() || email?.split("@")[0] || "Roommate";
    const payload = {
      id: userId?.trim() || user?.id || null,
      roomId: roomId?.trim() || user?.roomId || null,
      email,
      name: normalizedName,
    };

    persistUser(payload);
    // Placeholder: real auth flow should live here.
    return payload;
  }, [persistUser, user?.id, user?.roomId]);

  const updateProfile = useCallback(
    (partial) => {
      setUser((prev) => {
        const next = { ...prev, ...partial };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
