import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for server code, acting as the signed-in Clerk user.
 * Uses the public anon key: the Clerk session token tells Supabase who the
 * user is, and RLS decides what they can see. No service-role key anywhere.
 */
export async function supabaseForUser() {
  const { getToken } = await auth();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => (await getToken()) ?? null }
  );
}

/** Supabase client with no user, for reading a shared recipe by its link. */
export function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
