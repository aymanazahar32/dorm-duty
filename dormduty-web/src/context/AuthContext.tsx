"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";

export type DormDutyProfile = {
  id: string;
  email: string | null;
  name: string | null;
  room_id: string | null;
  aura_points: number | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: DormDutyProfile | null;
  roomId: string | null;
  loading: boolean;
  profileLoading: boolean;
  authError: string | null;
  magicLinkSent: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<DormDutyProfile | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

const getApiBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DormDutyProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const registeringUserRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, room_id, aura_points")
        .eq("id", userId)
        .maybeSingle<DormDutyProfile>();

      if (error) {
        throw error;
      }

      return data ?? null;
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false);
      }
    }
  }, []);

  const registerUserIfNeeded = useCallback(
    async (authUser: User | null) => {
      if (!authUser?.id || registeringUserRef.current === authUser.id) {
        return null;
      }

      registeringUserRef.current = authUser.id;

      try {
        const response = await fetch(`${apiBaseUrl}/api/registerUser`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: {
              id: authUser.id,
              email: authUser.email,
            },
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to register user");
        }

        const payload = (await response.json()) as { data?: DormDutyProfile | null };
        return payload?.data ?? null;
      } finally {
        registeringUserRef.current = null;
      }
    },
    [apiBaseUrl]
  );

  const syncProfile = useCallback(
    async (authUser: User | null, { forceRegister = false } = {}) => {
      if (!authUser) {
        setProfile(null);
        setRoomId(null);
        return;
      }

      try {
        if (forceRegister || !profile) {
          try {
            await registerUserIfNeeded(authUser);
          } catch (err) {
            console.error("Failed to register user", err);
            if (mountedRef.current) {
              setAuthError(err instanceof Error ? err.message : String(err));
            }
          }
        }

        const data = await fetchUserProfile(authUser.id);

        if (mountedRef.current) {
          setProfile(data);
          setRoomId(data?.room_id ?? null);
          setAuthError(null);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        if (mountedRef.current) {
          setAuthError(err instanceof Error ? err.message : String(err));
        }
      }
    },
    [fetchUserProfile, profile, registerUserIfNeeded]
  );

  const handleSessionChange = useCallback(
    async (event: string, nextSession: Session | null) => {
      if (!mountedRef.current) {
        return;
      }

      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setRoomId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      await syncProfile(nextUser, {
        forceRegister: event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION",
      });

      if (mountedRef.current) {
        setLoading(false);
      }
    },
    [syncProfile]
  );

  useEffect(() => {
    let subscription: { unsubscribe?: () => void } | null = null;

    const initialiseSession = async () => {
      try {
        if (typeof window !== "undefined") {
          const hashValue = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : "";

          if (hashValue) {
            const params = new URLSearchParams(hashValue);
            const hashError = params.get("error");
            const hashDescription = params.get("error_description");

            if (hashError && mountedRef.current) {
              setAuthError(hashDescription || "Authentication failed.");
              setMagicLinkSent(false);
              setLoading(false);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }

        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        await handleSessionChange("INITIAL_SESSION", initialSession);

        if (mountedRef.current && !initialSession?.user) {
          setLoading(false);
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
          if (event === "TOKEN_REFRESHED") {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            return;
          }

          await handleSessionChange(event, nextSession);
        });

        subscription = listener?.subscription ?? null;
      } catch (err) {
        console.error("Supabase auth initialisation failed", err);

        if (mountedRef.current) {
          setAuthError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    };

    initialiseSession();

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [handleSessionChange]);

  const signInWithEmail = useCallback(async (email: string) => {
    setAuthError(null);
    setMagicLinkSent(false);

    const redirectTo =
      process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ??
      (typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setMagicLinkSent(true);
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    setMagicLinkSent(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setRoomId(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return null;
    }

    const data = await fetchUserProfile(user.id);

    if (mountedRef.current) {
      setProfile(data);
      setRoomId(data?.room_id ?? null);
    }

    return data;
  }, [fetchUserProfile, user]);

  const contextValue: AuthContextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      roomId,
      loading,
      profileLoading,
      authError,
      magicLinkSent,
      signInWithEmail,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      roomId,
      loading,
      profileLoading,
      authError,
      magicLinkSent,
      signInWithEmail,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
