import { getUserDataById } from "../utils/service-supabase";

async function testGraphInvoke() {
  const userConfig = await getUserDataById(
    "f7dfecb9-b750-477d-8f2c-c090a7aa5dce",
  );
  if (!userConfig) {
    console.error("User configuration not found");
    return;
  }
  const {
    ga_access_token,
    ga_refresh_token,
    ga_property_id,
    notion_access_token,
  } = userConfig;
  const response = await fetch("http://localhost:3000/run-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ga_access_token: ga_access_token,
      ga_refresh_token: ga_refresh_token,
      ga_property_id: ga_property_id,
      notion_access_token: notion_access_token,
    }),
  });

  const result = await response.json();
  console.log("Graph response:", result);
}

testGraphInvoke().catch(console.error);
