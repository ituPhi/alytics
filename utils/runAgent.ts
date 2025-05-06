import { Runnable } from "@langchain/core/runnables";

async function runAgent(props: { state: any; agent: Runnable }) {
  const { agent, state } = props;
  let result = await agent.invoke(state);
  return {
    report: result,
  };
}
