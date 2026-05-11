"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseAuthOptions {
  /** If true, redirects to /login when user is not authenticated. */
  requireAuth?: boolean;
  /** If true, verifies admin role after fetching the user. */
  requireAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Provides the current Supabase user and optional auth guards.
 *
 * @example — require login only
 * const { user, loading } = useAuth({ requireAuth: true });
 *
 * @example — require admin role
 * const { user, isAdmin, loading } = useAuth({ requireAdmin: true });
 */
export function useAuth({ requireAuth = false, requireAdmin = false }: UseAuthOptions = {}): AuthState {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user && requireAuth) {
        router.replace("/login");
        return;
      }

      if (user && requireAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const adminRole = profile?.role === "admin";
        setIsAdmin(adminRole);
        if (!adminRole) router.replace("/");
      }

      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && requireAuth) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router, requireAuth, requireAdmin]);

  return { user, isAdmin, loading };
}
