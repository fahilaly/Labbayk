import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

export function createChannel(name: string): RealtimeChannel {
  return getSupabase().channel(name, { config: { broadcast: { self: false } } });
}

export function removeChannel(channel: RealtimeChannel) {
  getSupabase().removeChannel(channel);
}

export const EMERGENCY_CHANNEL = "labbayk-emergency";

export type EmergencyEvent =
  | { type: "EMERGENCY_TRIGGERED" }
  | { type: "ALERT_SENT"; volunteer: string }
  | { type: "VOLUNTEER_ACCEPTED"; volunteer: string }
  | { type: "VOLUNTEER_DECLINED"; volunteer: string }
  | { type: "VOLUNTEER_ARRIVED" }
  | { type: "CASE_CRITICAL" }
  | { type: "CASE_RESOLVED"; outcome: "stable" | "transport" | "critical" }
  | { type: "RESET" };
