// reports/index.ts
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { promises as fs } from "fs";
import path from "path";

const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = `properties/${process.env.PROPERTY_ID}`; // more clear

type ReportResult = Record<string, any>;

interface Report {
  name: string;
  description: string;
  run: () => Promise<ReportResult[]>;
}

// Define individual reports
const reports: Report[] = [
  {
    name: "Top Pages",
    description: "Top 10 pages by screen views.",
    run: async () => {
      const [response] = await analyticsDataClient.runReport({
        property: propertyId,
        dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      });
      return (
        response.rows?.map((row) => ({
          pagePath: row.dimensionValues?.[0].value ?? "unknown",
          screenPageViews: parseInt(row.metricValues?.[0].value ?? "0"),
        })) ?? []
      );
    },
  },
  {
    name: "Source Engagement",
    description: "Top sources with active users and session duration.",
    run: async () => {
      const [response] = await analyticsDataClient.runReport({
        property: propertyId,
        dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "activeUsers" }, { name: "averageSessionDuration" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      });
      return (
        response.rows?.map((row) => ({
          sessionSource: row.dimensionValues?.[0].value ?? "unknown",
          activeUsers: parseInt(row.metricValues?.[0].value ?? "0"),
          averageSessionDuration: parseFloat(
            row.metricValues?.[1].value ?? "0",
          ),
        })) ?? []
      );
    },
  },
  {
    name: "Country Report",
    description: "User activity by country.",
    run: async () => {
      const [response] = await analyticsDataClient.runReport({
        property: propertyId,
        dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });
      return (
        response.rows?.map((row) => ({
          country: row.dimensionValues?.[0].value ?? "unknown",
          activeUsers: parseInt(row.metricValues?.[0].value ?? "0"),
        })) ?? []
      );
    },
  },
  // we can easily add more later...
];

export async function runAllReports(): Promise<Record<string, ReportResult[]>> {
  const results: Record<string, ReportResult[]> = {};

  for (const report of reports) {
    try {
      const data = await report.run();
      results[report.name] = data;
    } catch (error) {
      console.error(`Error running report: ${report.name}`, error);
      results[report.name] = [];
    }
  }

  return results;
}

//const reportTest = await runAllReports();
//console.log(reportTest);

// create helper function to get data from markdown
export async function getGoals() {
  const filePath = path.resolve(process.cwd(), "configs", "goals.md");
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Error reading goals file: ${error.message}`);
  }
}
