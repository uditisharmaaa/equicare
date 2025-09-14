import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase project settings
const SUPABASE_URL = "https://isnnshrqvlbyfexelupb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzbm5zaHJxdmxieWZleGVsdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTkyNzEsImV4cCI6MjA3MzM3NTI3MX0.x5uRh8iDtmkpE-qzssVAwRvBmvPSC0ZdPxJE8HTKJVg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
