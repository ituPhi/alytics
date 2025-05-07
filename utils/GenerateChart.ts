import { CreateChart } from "./CreateChart"; // wherever you put the helper
import { runAllReports } from "./data";

interface ChartConfig {
  data: any[];
  labelKey: string; // which field is the label
  valueKey: string[]; // which fields are the values
  chartType?: "bar" | "line" | "pie"; // optional, default "bar"
  title: string;
}

export async function GenerateSimpleChartNode(config: ChartConfig) {
  const { data, labelKey, valueKey, chartType = "bar", title } = config;
  const labels = data.map((item) => item[labelKey]);
  const datasets = valueKey.map((valueKey) => ({
    label: valueKey,
    data: data.map((item) => item[valueKey]),
  }));

  const pngBuffer = await CreateChart({
    labels,
    datasets,
    chartType,
    title,
  });

  // here we need to upload to supabase as PNG and return the URL
  return {
    imageBuffer: pngBuffer,
  };
}
