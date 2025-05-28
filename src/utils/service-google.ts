import { google } from "googleapis";

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
export async function initAnalyticsClient(
  ga_access_token: string,
  ga_refresh_token: string,
  ga_property_id: string,
) {
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI =
    "https://alytics.netlify.app/api/auth/analytics/callback";

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing Google API credentials");
  }

  const accessToken = ga_access_token;
  const refreshToken = ga_refresh_token;
  const propertyId = ga_property_id;

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

  google.options({ auth: oauth2Client });
  const analyticsData = google.analyticsdata("v1beta");

  return {
    analyticsData,
    propertyId: `properties/${propertyId}`,
  };
}

export async function getTopPagesReport(
  analyticsData: any,
  propertyId: string,
  startDate: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: startDate,
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

export async function getSourceEngagementReport(
  analyticsData: any,
  propertyId: string,
  startDate: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: startDate,
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
  startDate: string,
): Promise<ReportResult[]> {
  try {
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [
          {
            startDate: startDate,
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
export async function runAllReports(
  ga_access_token: string,
  ga_refresh_token: string,
  ga_property_id: string,
  startDate: string,
): Promise<ReportsData> {
  const results: ReportsData = {};

  try {
    // Initialize the analytics client
    const { analyticsData, propertyId } = await initAnalyticsClient(
      ga_access_token,
      ga_refresh_token,
      ga_property_id,
    );

    // Run all reports in parallel
    const [topPages, sourceEngagement, countryReport] = await Promise.all([
      getTopPagesReport(analyticsData, propertyId, startDate),
      getSourceEngagementReport(analyticsData, propertyId, startDate),
      getCountryReport(analyticsData, propertyId, startDate),
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
  try {
    const content = `# Company Goals and KPIs

    ## Business Goal 1: Increase Product Sales
    - **KPI 1.1:** Increase Conversion Rate (Purchases / Sessions) by 15% within 6 months.
    - **KPI 1.2:** Grow average order value by 10% through upselling strategies.

    ## Business Goal 2: Expand Customer Base
    - **KPI 2.1:** Increase new customer acquisition by 20% quarter-over-quarter.
    - **KPI 2.2:** Improve website traffic by 25% through organic search (SEO efforts).

    ## Business Goal 3: Enhance Customer Retention
    - **KPI 3.1:** Achieve a 10% improvement in customer repeat purchase rate.
    - **KPI 3.2:** Increase customer satisfaction score (CSAT) to 90% or higher.

    ## Business Goal 4: Optimize Operational Efficiency
    - **KPI 4.1:** Reduce cart abandonment rate by 12% with better checkout UX.
    - **KPI 4.2:** Decrease average customer support response time to under 2 hours.
`;
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
