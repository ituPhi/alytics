import { BetaAnalyticsDataClient } from "@google-analytics/data";

const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = "442724200"; // e.g. '123456789'

async function runCountryReport() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
  });
  const results = response.rows?.map((row) => ({
    country: row.dimensionValues[0].value,
    activeUsers: row.metricValues[0].value,
  }));

  // console.log("Report result:", results);
  return results;
}

async function runTopPagesReport() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [
      {
        metric: {
          metricName: "screenPageViews",
        },
        desc: true,
      },
    ],
    limit: 10,
  });
  const results = response.rows?.map((row) => ({
    pagePath: row.dimensionValues[0].value,
    screenPageViews: row.metricValues[0].value,
  }));

  return results;
}

async function runSourceEngagementReport() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "activeUsers" }, { name: "averageSessionDuration" }],
    orderBys: [
      {
        metric: {
          metricName: "activeUsers",
        },
        desc: true,
      },
    ],
    limit: 10,
  });

  const results = response.rows?.map((row) => {
    const sessionSource = row.dimensionValues[0].value;
    const activeUsers = row.metricValues[0].value;
    const averageSessionDuration = row.metricValues[1].value;
    return { sessionSource, activeUsers, averageSessionDuration };
  });
  return results;
}

export async function runReports() {
  const [topPages, sourceEngagement, countryReport] = await Promise.all([
    runTopPagesReport(),
    runSourceEngagementReport(),
    runCountryReport(),
  ]);

  const reports = {
    topPages,
    sourceEngagement,
    countryReport,
  };
  return reports;
}
//console.log("Report result:", await runReports());
