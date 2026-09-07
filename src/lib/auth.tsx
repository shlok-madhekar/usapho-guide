"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { authConfigured, createClient } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/roles";

interface AuthValue {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  profile: Profile | null;
  client: SupabaseClient | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState<SupabaseClient | null>(() =>
    authConfigured ? createClient() : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!authConfigured);

  const loadProfile = useCallback(
    async (userId: string, email: string | null) => {
      if (!client) return;
      const { data } = await client
        .from("profiles")
        .select("id, email, display_name, roles")
        .eq("id", userId)
        .maybeSingle();
      setProfile({
        id: userId,
        email: data?.email ?? email,
        display_name: data?.display_name ?? null,
        roles: (data?.roles ?? []) as Role[],
      });
    },
    [client]
  );

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user.email ?? null).finally(
          () => setReady(true)
        );
      } else {
        setReady(true);
      }
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        loadProfile(next.user.id, next.user.email ?? null);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [client, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error("Auth is not configured");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [client]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!client) throw new Error("Auth is not configured");
      const { error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
    },
    [client]
  );

  const signOut = useCallback(async () => {
    await client?.auth.signOut();
    setProfile(null);
  }, [client]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email ?? null);
  }, [session, loadProfile]);

  const value = useMemo(
    () => ({
      ready,
      configured: authConfigured,
      session,
      profile,
      client,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [ready, session, profile, client, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
