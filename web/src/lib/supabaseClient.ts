// Dynamic Supabase client creation to avoid build-time issues
export async function getSupabaseClient() {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      return createClient(url, anonKey);
    } else {
      // Fallback mock client
      return {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          resetPasswordForEmail: () => Promise.resolve({ error: null }),
          signUp: () => Promise.resolve({ error: null }),
          signInWithPassword: () => Promise.resolve({ error: null }),
        }
      };
    }
  } catch (e) {
    // Fallback mock client
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ error: null }),
      }
    };
  }
}

// For backward compatibility, export a mock client that will be replaced at runtime
// This is typed as any to avoid TypeScript issues during build
export const supabaseBrowser: any = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: () => Promise.resolve({ error: null }),
    signUp: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ error: null }),
  }
};
