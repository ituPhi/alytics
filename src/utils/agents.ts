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

    If you receive any data that is empty or not in the correct format, write in your report that no data was found and skip the report.

    - Relate observations to the KPIs if possible.
    - Mention any clear risks, opportunities, or patterns.
    - Be concise, professional, and actionable.

    DATA: {data}

    GOALS & KPIs: {goals}
`,
  );

  return promptTemplate.pipe(llm);
}

export async function createCriticalThinkerAgent({
  llm,
}: {
  llm: ChatOpenAI;
}): Promise<Runnable> {
  let promptTemplate = PromptTemplate.fromTemplate(
    `Translate the following analysis to Spanish, respect the markdown format do not change anything else.

    If you receive a report that no data was found, format it nicely.

    REPORT: {reportMarkdown}

`,
  );

  return promptTemplate.pipe(llm);
}

export async function createCopyWriterAgent({
  llm,
}: {
  llm: ChatOpenAI;
}): Promise<Runnable> {
  let copyWriterPrompt = PromptTemplate.fromTemplate(`
    You are a senior business data analyst and expert report writer.
    Your task is to generate a professional, executive-style final report in Markdown format.

    If you receive in the analysis no data or data that is empty or not in the correct format, write in your report that no data was found and skip the report by just formating a nice response, passing along the message.

    You are provided with:
    - An Analysis of the data
    - A list of charts (each with a title, description, and image URL).
    - The company's business goals and KPIs.

    **Instructions:**
    1. Format the Analysis into a report using proper Markdown syntax.
    2. For each chart:
       - Add the title as an H2 header (##).
       - Write a short, clear description below it.
       - Insert the chart image using: ![Title](url)
       - Use separators (---) between major sections for clarity.
    3. Relate observations back to the provided Goals & KPIs whenever possible.
    4. Identify any obvious risks, opportunities, or notable patterns.
    5. Keep the tone concise, professional, and actionable.
    6. Ensure the document is clean and ready to paste into Notion.

    **Example Format:**
    markdown
    # Website Analytics Report

    ## Top Pages
    Top pages by screen page views.

    ![Top Pages](https://placehold.co/600x600)

    ---

    ## Source Engagement
    Source engagement by active users and average session duration.

    ![Source Engagement](https://placehold.co/600x600)

    ---

    ## Country Report
    Country report showing active users by country.

    ![Country Report](https://placehold.co/600x600)

    ---

    Here is the data you must use:

    DATA: {data}
    ANALYSIS: {analysis}
    CHARTS: {charts}

    Here are the business goals and KPIs to keep in mind:
    GOALS & KPIs: {goals}
    `);
  return copyWriterPrompt.pipe(llm);
}
