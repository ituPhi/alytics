import { createClient } from "@supabase/supabase-js";
export const sbc = createClient(
  process.env.SB_URL,
  process.env.SB_SERVICE_KEY,
  {
    auth: { persistSession: false },
  },
);
