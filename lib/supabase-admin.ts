// uso exclusivo no servidor — nunca importar em componentes client
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminConfigurado = Boolean(url && serviceKey);

let admin: SupabaseClient | null = null;

/** Cliente com service role (somente servidor); null se não configurado. */
export function getAdmin(): SupabaseClient | null {
  if (!adminConfigurado) return null;
  if (!admin) {
    admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

/** Resolve o usuário a partir do header Authorization: Bearer <token>. */
export async function usuarioDoToken(authHeader: string | null) {
  const a = getAdmin();
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!a || !token) return null;
  const { data, error } = await a.auth.getUser(token);
  return error ? null : data.user;
}
