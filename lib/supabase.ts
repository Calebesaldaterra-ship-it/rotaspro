"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anon);

let client: SupabaseClient | null = null;

/** Cliente Supabase do navegador; null se as envs não estiverem configuradas. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  if (!client) client = createClient(url!, anon!);
  return client;
}
