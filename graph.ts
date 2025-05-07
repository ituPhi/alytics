import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { externalChartConfig, externalGoals } from "./configs/config";
import { createAnalizerAgent } from "./utils/agents";
import { runAllReports, getGoals } from "./utils/data";
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

async function AnalyzeNode(state: typeof StateAnnotation.State) {
  //currently is turned off its not returning state
  const { data, goals } = state;

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_KEY,
    model: "gpt-4.1-nano",
  });
  const analizer = await createAnalizerAgent({ llm: llm });
  //const analisys = await analizer.invoke({ data: data, goals: goals });
  //console.log(analisys.content);
}

async function ChartsNode(state: typeof StateAnnotation.State) {
  const chartConfigs = externalChartConfig; // chart config should eventualy be a call to supabase
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
  //TODO:Would be awesome to have a node to apply critical thinking on the analisis
  .addEdge("prepareData", "chartsNode")
  //TODO:COMPILE NODE we need a node that compiles charts + analisis in a nice markdown format
  //TODO:PUBLISH NODE we need a node that publishes markdown to Notion Blocks in a new page
  .addEdge("chartsNode", "__end__")
  .addEdge("analize", "__end__")
  .compile();

const testResponse = await workflow.invoke({});
console.log(testResponse);
