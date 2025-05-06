import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

export async function createAnalizerAgent({
  llm,
}: {
  llm: ChatOpenAI;
}): Promise<Runnable> {
  let promptTemplate = PromptTemplate.fromTemplate(
    `You are a senior data analyst.
    Given the following data and business goals/KPIs, provide an executive analysis.

    - Relate observations to the KPIs if possible.
    - Mention any clear risks, opportunities, or patterns.
    - Be concise, professional, and actionable.

    DATA: {data}

    GOALS & KPIs: {goals}
`,
  );

  return promptTemplate.pipe(llm);
}
