import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

export async function createAgent({
  llm,
}: {
  llm: ChatOpenAI;
}): Promise<Runnable> {
  let promptTemplate = PromptTemplate.fromTemplate(
    "You are a data analyst: given the following KPI's and goals provide an in depth analysis of the data relate what the data says about each KPI, and use the data for your recomendation: {data}, {goals} ",
  );

  return promptTemplate.pipe(llm);
}
