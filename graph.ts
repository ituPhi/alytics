import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { promises as fs } from "fs";
import { externalChartConfig } from "./configs/chartConfig";
import { externalGoals } from "./configs/externalGoals";
import { createAnalizerAgent } from "./utils/AnalizerAgent";
import { runAllReports } from "./utils/data";

import { GenerateSimpleChartNode } from "./utils/GenerateChart";

const StateAnnotation = Annotation.Root({
  data: Annotation<any>,
  goals: Annotation<string>,
  analysis: Annotation<string>,
  charts: Annotation<
    {
      title: string;
      description: string;
      buffer: Buffer;
    }[]
  >,
  reportMarkdown: Annotation<string>, // full final report in Markdown
});

async function PrepareDataNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  //gather data
  const data = await runAllReports();
  const goals = externalGoals;
  return {
    data: data,
    goals: goals,
  };
}

async function AnalyzeNode(state: typeof StateAnnotation.State) {
  //currently is turned off its not returning state
  const { data, goals } = state;

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_KEY,
    model: "gpt-4.1-nano",
  });
  const analizer = await createAnalizerAgent({ llm: llm });
  // const analisys = await analizer.invoke({ data: data, goals: goals });
  //console.log(analisys.content);
}

async function ChartsNode(state: typeof StateAnnotation.State) {
  const chartConfigs = externalChartConfig;
  return {
    charts: await Promise.all(
      chartConfigs.map(async (config) => ({
        title: config.dataKey,
        description: config.description,
        buffer: await GenerateSimpleChartNode({
          data: state.data[config.dataKey],
          labelKey: config.labelKey,
          valueKey: config.valueKey,
          chartType: config.chartType,
          title: config.title,
        }),
      })),
    ),
  };
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("prepareData", PrepareDataNode)
  .addNode("analize", AnalyzeNode)
  .addNode("chartsNode", ChartsNode)
  .addEdge("__start__", "prepareData")
  .addEdge("prepareData", "analize")
  .addEdge("prepareData", "chartsNode")
  .addEdge("chartsNode", "__end__")
  .addEdge("analize", "__end__")
  .compile();

const testResponse = await workflow.invoke({});
const charts = testResponse.charts;
let buffer = charts[0].buffer;
//console.log(buffer["imageBuffer"]);
const fileName = `./${charts[1].title.replace(/\s+/g, "_")}.png`;
fs.writeFile(fileName, buffer["imageBuffer"]);
