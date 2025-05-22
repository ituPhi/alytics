import { CreateChart } from "./CreateChart"; // wherever you put the helper
import { runAllReports } from "./service-google";
import { sbc } from "./clients";

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

  const titleEXT = `${title}.png`;
  async function uploadChartImage(buffer: Buffer, fileName: string) {
    const { data: uploadData, error: uploadError } = await sbc.storage
      .from("charts")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: signedData, error: signedError } = await sbc.storage
      .from("charts")
      .createSignedUrl(titleEXT, 60 * 60 * 24 * 7);

    if (signedError)
      throw new Error(`Failed to generate signed URL: ${signedError.message}`);

    return signedData;
  }
  return uploadChartImage(pngBuffer, titleEXT);
}
