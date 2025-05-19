import { promises as fs } from "fs";
import path from "path";
import { google } from "googleapis";

import { getUserData } from "./getUserData";

// Define TypeScript interfaces for report data
export interface ReportResult {
  [key: string]: any;
}

export interface ReportsData {
  [reportName: string]: ReportResult[];
}

/**
 * Initialize the Google Analytics client
 * @returns An object with initialized clients and property ID
 */
export async function initAnalyticsClient() {
  const userData = await getUserData();

  if (!userData) {
    throw new Error("No user data found");
  }

  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = "https://localhost:4321/api/auth/analytics/callback";

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing Google API credentials");
  }

  const accessToken = userData.ga_access_token;
  const refreshToken = userData.ga_refresh_token;
  const propertyId = userData.ga_property_id;

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Set the auth client for Google APIs
  google.options({ auth: oauth2Client });

  // Initialize Analytics Data API
  const analyticsData = google.analyticsdata("v1beta");

  //console.log("OAuth2Client initialized:", oauth2Client);

  return {
    analyticsData,
    propertyId: `properties/${propertyId}`,
    userData,
  };
}

/**
 * Run the Top Pages report
 */
export async function getTopPagesReport(
  analyticsData: any,
  propertyId: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: "2020-01-01",
            endDate: "today",
          },
        ],
        dimensions: [
          {
            name: "pagePath",
          },
        ],
        metrics: [
          {
            name: "screenPageViews",
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: "screenPageViews",
            },
            desc: true,
          },
        ],
        limit: 10,
      },
    });

    const rows = response.data.rows || [];
    return rows.map((row) => ({
      pagePath: row.dimensionValues?.[0].value || "unknown",
      screenPageViews: parseInt(row.metricValues?.[0].value || "0"),
    }));
  } catch (error) {
    console.error("Error in Top Pages report:", error);
    return [];
  }
}

/**
 * Run the Source Engagement report
 */
export async function getSourceEngagementReport(
  analyticsData: any,
  propertyId: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: "2020-01-01",
            endDate: "today",
          },
        ],
        dimensions: [
          {
            name: "sessionSource",
          },
        ],
        metrics: [
          {
            name: "activeUsers",
          },
          {
            name: "averageSessionDuration",
          },
        ],
        orderBys: [
          {
            metric: {
              metricName: "activeUsers",
            },
            desc: true,
          },
        ],
        limit: 10,
      },
    });

    const rows = response.data.rows || [];
    return rows.map((row) => ({
      sessionSource: row.dimensionValues?.[0].value || "unknown",
      activeUsers: parseInt(row.metricValues?.[0].value || "0"),
      averageSessionDuration: parseFloat(row.metricValues?.[1].value || "0"),
    }));
  } catch (error) {
    console.error("Error in Source Engagement report:", error);
    return [];
  }
}

/**
 * Run the Country Report
 */
export async function getCountryReport(
  analyticsData: any,
  propertyId: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: "2020-01-01",
            endDate: "today",
          },
        ],
        dimensions: [
          {
            name: "country",
          },
        ],
        metrics: [
          {
            name: "activeUsers",
          },
        ],
      },
    });

    const rows = response.data.rows || [];
    return rows.map((row) => ({
      country: row.dimensionValues?.[0].value || "unknown",
      activeUsers: parseInt(row.metricValues?.[0].value || "0"),
    }));
  } catch (error) {
    console.error("Error in Country report:", error);
    return [];
  }
}

/**
 * Run all reports and return the results
 * @returns Object containing all report results
 */
export async function runAllReports(): Promise<ReportsData> {
  const results: ReportsData = {};

  try {
    // Initialize the analytics client
    const { analyticsData, propertyId } = await initAnalyticsClient();

    // Run all reports in parallel
    const [topPages, sourceEngagement, countryReport] = await Promise.all([
      getTopPagesReport(analyticsData, propertyId),
      getSourceEngagementReport(analyticsData, propertyId),
      getCountryReport(analyticsData, propertyId),
    ]);

    // Collect results
    results["Top Pages"] = topPages;
    results["Source Engagement"] = sourceEngagement;
    results["Country Report"] = countryReport;

    return results;
  } catch (error) {
    console.error("Error executing reports:", error);
    return results;
  }
}

/**
 * Get goals from markdown file
 * @returns Goal content from markdown file
 */
export async function getGoals(): Promise<string> {
  const filePath = path.resolve(process.cwd(), "configs", "goals.md");
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading goals file:`, error);
    return "No goals found.";
  }
}

// For testing - uncomment to run directly
//(async () => {
//  try {
//    const results = await runAllReports();
//    console.log(JSON.stringify(results, null, 2));
//  } catch (error) {
//    console.error("Error running reports:", error);
//  }
//})();
