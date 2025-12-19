"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Dynamic import to avoid build-time issues
let supabaseBrowser: any = null;

async function getSupabaseClient() {
  if (!supabaseBrowser) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && anonKey) {
        supabaseBrowser = createClient(url, anonKey);
      } else {
        supabaseBrowser = {
          auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
          }
        };
      }
    } catch (e) {
      supabaseBrowser = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        }
      };
    }
  }
  return supabaseBrowser;
}

export function useRequireAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getSupabaseClient().then((client) => {
      if (!client) {
        setLoading(false);
        return;
      }

      client.auth.getSession().then(({ data }: any) => {
        if (!data.session) {
          router.replace("/auth");
        } else {
          setUser(data.session.user);
          setLoading(false);
        }
      });

      // Subscribe to auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event: any, session: any) => {
        if (!session) {
          router.replace("/auth");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    });
  }, [router]);

  return { loading, user };
}
