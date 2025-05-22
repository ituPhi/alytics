import type { UserConfig } from "./service-supabase";

export function calculateNextrun(user: UserConfig) {
  const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
  const sevenDaysInMs = daysToMs(7);
  const fourteenDaysInMs = daysToMs(14);
  const monthlyDaysInMs = daysToMs(30);

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
  return nextRunMs;
}
