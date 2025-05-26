// scheduler.ts
import { schedules } from "@trigger.dev/sdk/v3";
import { getTodayUsers, updateUserNextRun } from "../utils/service-supabase";
import { processUserReport } from "./processUserReport";
import {
  calculateNextRunDate,
  formatDateForStorage,
} from "../utils/date-utils";

export const runScheduler = schedules.task({
  id: "report-scheduler",
  cron: "*/5 * * * *", // Every 5 minutes (adjust as needed)
  maxDuration: 60, // 1 minute max for the scheduler
  run: async (payload, { ctx }) => {
    // Fetch users who need reports today
    const users = await getTodayUsers();

    if (users.length === 0) return { processed: 0 };

    // Batch trigger the processing task for each user
    await processUserReport.batchTrigger(
      users.map((user) => ({
        payload: {
          ga_property_id: user.ga_property_id,
          ga_access_token: user.ga_access_token,
          ga_refresh_token: user.ga_refresh_token,
          notion_access_token: user.notion_access_token,
          userId: user.id,
        },
      })),
    );

    // Update next run dates for users
    for (const user of users) {
      const nextRunDate = calculateNextRunDate(user.frequency);
      const formattedNextRunDate = formatDateForStorage(nextRunDate);
      await updateUserNextRun(user, formattedNextRunDate);
    }

    return { processed: users.length };
  },
});
