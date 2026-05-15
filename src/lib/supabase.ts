import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Convenience export — safe to use in client components
export const supabase = {
  channel: (name: string) => getSupabase().channel(name),
  removeChannel: (channel: ReturnType<SupabaseClient["channel"]>) =>
    getSupabase().removeChannel(channel),
} as const;

export const EMERGENCY_CHANNEL = "labbayk-emergency";

export type EmergencyEvent =
  | { type: "EMERGENCY_TRIGGERED" }
  | { type: "ALERT_SENT"; volunteer: string }
  | { type: "VOLUNTEER_ACCEPTED"; volunteer: string }
  | { type: "VOLUNTEER_ARRIVED" }
  | { type: "CASE_RESOLVED"; outcome: "stable" | "transport" | "critical" }
  | { type: "RESET" };
