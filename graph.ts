import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { externalChartConfig, externalGoals } from "./configs/config";
import {
  createAnalizerAgent,
  createCopyWriterAgent,
  createCriticalThinkerAgent,
} from "./utils/agents";
import { runAllReports, getGoals } from "./utils/data";
import { GenerateSimpleChartNode } from "./utils/GenerateChart";
import { markdownToBlocks } from "@tryfabric/martian";
import { Client } from "@notionhq/client";
import fs from "fs";

const StateAnnotation = Annotation.Root({
  data: Annotation<any>,
  goals: Annotation<string>,
  analysis: Annotation<string>,
  charts: Annotation<
    {
      title: string;
      description: string;
      url: string;
      buffer: Buffer;
    }[]
  >,
  reportMarkdown: Annotation<string>,
});

async function PrepareDataNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  //gather data, goals
  const [data, goals] = await Promise.all([runAllReports(), getGoals()]);
  return {
    data: data,
    goals: goals,
  };
}

async function AnalyzeNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  const { data, goals } = state;
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_KEY,
    model: "gpt-4.1-nano",
  });
  const analizer = await createAnalizerAgent({ llm: llm });
  const analysis = await analizer.invoke({ data: data, goals: goals });
  const content = analysis.content;
  let analysisObj = { content };
  return {
    analysis: content,
  };
}

async function CriticalThinker(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_KEY,
    model: "gpt-4.1-nano",
  });
  const criticalThinker = await createCriticalThinkerAgent({ llm: llm });
  const refinedAnalysis = await criticalThinker.invoke({
    reportMarkdown: state.reportMarkdown,
  });
  return {
    reportMarkdown: refinedAnalysis.content,
  };
}

async function ChartsNode(state: typeof StateAnnotation.State) {
  // this return PROMISE is NOT properly typed
  const chartConfigs = externalChartConfig; // chart config should eventualy be a call to supabase
  return {
    charts: await Promise.all(
      chartConfigs.map(async (config) => ({
        title: config.dataKey,
        description: config.description,
        url: await GenerateSimpleChartNode({
          data: state.data[config.dataKey],
          labelKey: config.labelKey,
          valueKey: config.valueKey,
          chartType: config.chartType,
          title: config.title,
        }),
        //hard coded for testing untill we set the upload
      })),
    ),
  };
}

async function CompileNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_KEY,
    model: "gpt-4o",
  });
  const { data, analysis, charts, goals } = state;
  const copyWritter = await createCopyWriterAgent({ llm: llm });
  const finalReport = await copyWritter.invoke({
    data: data,
    analysis: analysis,
    charts: charts,
    goals: goals,
  });

  return {
    reportMarkdown: finalReport.content,
  };
}

async function PublishNode(state: typeof StateAnnotation.State) {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });
  const contentMD = state.reportMarkdown;
  console.log(contentMD);
  const notionBlocks = markdownToBlocks(contentMD);
  (async () => {
    const response = await notion.pages.create({
      parent: {
        type: "page_id",
        page_id: "1ee9084199fe809498dcf0c63d139419", // this page id or owkrspace it needs to be dynamically set
      },
      properties: {
        title: [
          {
            text: {
              content: `Weekly Report ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, // Or whatever title you want
            },
          },
        ],
      },
      children:
        notionBlocks as import("@notionhq/client/build/src/api-endpoints").BlockObjectRequest[], // Use the converted markdown blocks directly
    });
    //console.log(notionBlocks);
  })();
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("prepareData", PrepareDataNode)
  .addNode("analize", AnalyzeNode)
  .addNode("chartsNode", ChartsNode)
  .addNode("compile", CompileNode)
  .addNode("criticalThinker", CriticalThinker)
  .addNode("publish", PublishNode)
  .addEdge("__start__", "prepareData")
  .addEdge("prepareData", "analize")
  .addEdge("analize", "compile")
  .addEdge("compile", "criticalThinker")
  //TODO:Would be awesome to have a node to apply critical thinking on the analisis
  .addEdge("prepareData", "chartsNode")
  .addEdge("chartsNode", "compile")
  .addEdge("criticalThinker", "publish")
  .addEdge("publish", "__end__")
  .compile();

const testResponse = await workflow.invoke({});
console.log(testResponse.reportMarkdown);

const drawableGraph = await workflow.getGraphAsync();
const image = await drawableGraph.drawMermaidPng();
const arrayBuffer = await image.arrayBuffer();
fs.writeFileSync("graph.png", Buffer.from(arrayBuffer));
