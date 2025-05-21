import { getUserDataById } from "../utils/service-supabase";
import { createClient } from "@supabase/supabase-js";

async function run() {
  console.log("service Workflow Triggered");
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
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.IK || "",
      },
      body: JSON.stringify({
        ga_access_token: user.ga_access_token,
        ga_refresh_token: user.ga_refresh_token,
        ga_property_id: user.ga_property_id,
        notion_access_token: user.notion_access_token,
        userId: user.id,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      console.error(
        `Failed to invoke workflow for ${user.id}: ${result.error}`,
      );
    } else {
      console.log(`Invoked workflow for ${user.id}: ${result}`);
      const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
      const sevenDaysInMs = daysToMs(7);
      const fourteenDaysInMs = daysToMs(14);
      const monthlyDaysInMs = daysToMs(30);

      // Calculate next run date based on user's frequency
      let nextRunMs: number;
      const frequency = user.frequency || "weekly"; // Default to weekly if not specified

      switch (frequency) {
        case "weekly":
          nextRunMs = sevenDaysInMs;
          break;
        case "biweekly":
          nextRunMs = fourteenDaysInMs;
          break;
        case "monthly":
          nextRunMs = monthlyDaysInMs;
          break;
        default:
          nextRunMs = sevenDaysInMs; // Default to weekly
      }

      // Calculate the next run date
      const nextRunDate = new Date(Date.now() + nextRunMs);
      const formattedNextRunDate = nextRunDate.toISOString().split("T")[0];

      // Update the user's next_run and updated_at in the database
      const { error: updateError } = await supabase
        .from("user_configs")
        .update({
          next_run: formattedNextRunDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          `Failed to update next run date for ${user.id}: ${updateError.message}`,
        );
      } else {
        console.log(
          `Updated next run date for ${user.id} to ${formattedNextRunDate}`,
        );
      }
    }
  }
}
run().catch(console.error);
