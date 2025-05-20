import express from "express";
import { workflow } from "./graph";
import z from "zod";

const app = express();
app.use(express.json());

const InputSchema = z.object({
  ga_access_token: z.string(),
  ga_refresh_token: z.string(),
  ga_property_id: z.string(),
  notion_access_token: z.string(),
  user_id: z.string().optional(),
});

app.post("/run-report", async (req, res) => {
  const parse = InputSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const input = parse.data;
  try {
    const result = await workflow.invoke({
      ga_property_id: input.ga_property_id,
      ga_access_token: input.ga_access_token,
      ga_refresh_token: input.ga_refresh_token,
      notion_access_token: input.notion_access_token,
    });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("LangGraph Analytics Running ");
});
