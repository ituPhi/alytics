import { getUserDataById } from "../utils/service-supabase";
import { createClient } from "@supabase/supabase-js";

async function run() {
  console.log("service running");
  const supabase = createClient(
    process.env.SB_URL!,
    process.env.SB_SERVICE_KEY!,
  );
  const today = new Date().toISOString().split("T")[0];
  console.log("today", today);
  const { data: users, error } = await supabase
    .from("user_configs")
    .select("*")
    .eq("next_run", today);

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log(users);
  for (const user of users || []) {
    const response = await fetch("http://localhost:3000/run-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ga_access_token: user.ga_access_token,
        ga_refresh_token: user.ga_refresh_token,
        ga_property_id: user.ga_property_id,
        notion_access_token: user.notion_access_token,
      }),
    });

    const result = await response.json();
    console.log(`Invoked workflow for ${user.id}: ${result}`);
  }
}
run().catch(console.error);
