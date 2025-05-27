// processUserReport.ts
import { task } from "@trigger.dev/sdk/v3";
import { workflow } from "../graph";
import { traceable } from "langsmith/traceable";
import { CallLangGraph } from "../../tests/callFromLanServe";

type Payload = {
  ga_property_id: string;
  ga_access_token: string;
  ga_refresh_token: string;
  notion_access_token: string;
  userId: string;
};

const tracedWorkflowInvoke = traceable(
  async (payload: Payload) => workflow.invoke(payload),
  {
    run_type: "chain",
    name: "Alytic Report Generation",
  },
);

export const processUserReport = task({
  id: "process-user-report",
  // Configure a reasonable concurrency limit based on your resources
  queue: {
    concurrencyLimit: 5, // Process up to 5 users in parallel
  },
  // Configure machine resources if needed
  machine: {
    preset: "medium-1x", // Adjust based on your workflow's needs
  },
  // Set appropriate max duration
  maxDuration: 300, // 5 minutes
  run: async (payload: {
    ga_property_id: string;
    ga_access_token: string;
    ga_refresh_token: string;
    notion_access_token: string;
    userId: string;
  }) => {
    // Run the workflow for this specific user
    const result = await tracedWorkflowInvoke(payload);
    // const result = await CallLangGraph(payload, agentId);
    return result;
  },
});
