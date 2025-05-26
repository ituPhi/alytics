/**
 * Date utilities for consistent date handling across the application
 */

/**
 * Get today's date in YYYY-MM-DD format, using server's local timezone
 */
export function getToday(): string {
  const today = new Date();
  return formatDateForStorage(today);
}

/**
 * Format a date for storage in the database (YYYY-MM-DD)
 * This ensures consistent date format across the application
 */
export function formatDateForStorage(date: Date): string {
  // This uses the local timezone of the server to generate YYYY-MM-DD
  return date.toLocaleDateString("en-CA"); // en-CA uses YYYY-MM-DD format
}

/**
 * Calculate the next run date based on frequency
 * @param frequency The report frequency (weekly, biweekly, monthly)
 * @returns Date object representing the next run date
 */
export function calculateNextRunDate(frequency: string = "weekly"): Date {
  const now = new Date();
  const daysToAdd = getFrequencyDays(frequency);

  // Create a new date by adding the appropriate number of days
  const nextRunDate = new Date(now);
  nextRunDate.setDate(now.getDate() + daysToAdd);

  return nextRunDate;
}

/**
 * Calculate the start date for a report based on frequency
 * @param frequency The report frequency (weekly, biweekly, monthly)
 * @returns Date object representing the start date for the report period
 */
export function calculateReportStartDate(frequency: string = "weekly"): Date {
  const now = new Date();
  const daysToSubtract = getFrequencyDays(frequency);

  // Create a new date by subtracting the appropriate number of days
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysToSubtract);

  return startDate;
}

/**
 * Get the number of days corresponding to a frequency
 */
function getFrequencyDays(frequency: string): number {
  switch (frequency) {
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30; // Note: This is approximate
    default:
      return 7;
  }
}

/**
 * Convert milliseconds to days
 */
export function msToDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}

/**
 * Convert days to milliseconds
 */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Format a date as a readable string
 */
export function formatReadableDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
