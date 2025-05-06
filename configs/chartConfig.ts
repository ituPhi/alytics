export const externalChartConfig = [
  {
    dataKey: "Top Pages",
    description: "Chart for top pages",
    labelKey: "pagePath",
    valueKey: ["screenPageViews"],
    chartType: "pie" as const,
    title: "Top_Pages",
  },
  {
    dataKey: "Source Engagement",
    labelKey: "sessionSource",
    description: "Chart for top Engagement",
    valueKey: ["activeUsers", "averageSessionDuration"],
    chartType: "line" as const,
    title: "Source_Engagement",
  },
  {
    dataKey: "Country Report",
    labelKey: "country",
    description: "Chart for top Country",
    valueKey: ["activeUsers"],
    chartType: "pie" as const,
    title: "Source_Country",
  },
];
