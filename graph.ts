import { StateGraph, Annotation } from "@langchain/langgraph";
import { createAgent } from "./utils/createAgent";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { runReports } from "./utils/notion";
import { markdownToBlocks } from "@tryfabric/martian";

import {
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";

import { Client } from "@notionhq/client";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const StateAnnotation = Annotation.Root({
  data: Annotation<any>,
  goals: Annotation<string>,
  awnser: Annotation<BaseMessage[]>,
});

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_KEY,
  model: "gpt-4.1-nano",
});
const goals = `
  — Business Goal 1: Increase Product Sales
  — KPI 1: Conversion Rate (Purchases / Sessions)
  — Goal: Achieve a 2.5% purchase conversion rate sitewide.
  `;
const data = await runReports();

async function AnalizeNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  const analizer = await createAgent({ llm: llm });
  const response = await analizer.invoke({ data: data, goals: goals });
  let d = response["content"];
  let content = d;
  return {
    data: content,
  };
}

async function FormatNode(
  state: typeof StateAnnotation.State,
): Promise<typeof StateAnnotation.Update> {
  const response = await llm.invoke(
    `You are an expert markdown formatting agent. Format the following text beautifully in markdown:

      ${state.data}`,
  );

  //console.log(response);
  return {
    awnser: [response],
  };
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("analyze", AnalizeNode)
  .addNode("format", FormatNode)
  .addEdge("__start__", "analyze")
  .addEdge("analyze", "format")
  .addEdge("format", "__end__")
  .compile();

const testResponse = await workflow.invoke({
  data: data,
  goals: goals,
});
const t = testResponse;
let f = t.awnser[0]["content"];
const mdtext: string = f as string;
const md = markdownToBlocks(mdtext);

(async () => {
  const response = await notion.pages.create({
    parent: {
      type: "page_id",
      page_id: "1dd9084199fe8059b5afdcd322a46554",
    },
    properties: {
      title: [
        {
          text: {
            content: "Analytics Report", // Or whatever title you want
          },
        },
      ],
    },
    children:
      md as import("@notionhq/client/build/src/api-endpoints").BlockObjectRequest[], // Use the converted markdown blocks directly
  });
  console.log(response);
})();
