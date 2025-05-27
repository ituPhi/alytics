import { request } from "undici";
import { getUserDataById, UserConfig } from "../src/utils/service-supabase";

type Payload = {
  ga_property_id: string;
  ga_access_token: string;
  ga_refresh_token: string;
  notion_access_token: string;
  userId: string;
};

export async function CallLangGraph(payload: Payload, assistantId: string) {
  console.log("Creating new run...");
  const { statusCode, body } = await request("http://localhost:2024/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistant_id: assistantId,
      input: payload,
    }),
  });
  if (statusCode !== 200) {
    console.error("Failed to create run");
    return;
  }
  const run = await body.json();
  console.log(`Run created with ID ${run}`);
  return run;
}

//const userData = (await getUserDataById(
//  "41251478-56cd-4ef5-ba64-d1a89859294f",
//)) as UserConfig;
//
//const payload = {
//  ga_property_id: userData.ga_property_id,
//  ga_access_token: userData.ga_access_token,
//  ga_refresh_token: userData.ga_refresh_token,
//  notion_access_token: userData.notion_access_token,
//  userId: userData.id,
//};
//
//console.log(payload);
//const runTask = await CallLangGraph(payload, assistantId);
//console.log("Run task completed", runTask);
