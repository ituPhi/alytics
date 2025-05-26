import express from "express";
import helmet from "helmet";
import { processUserReport } from "./src/trigger/processUserReport";
import rateLimit from "express-rate-limit";
import cors from "cors";
// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
app.use(cors());

const appLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
const authenticateApiKey = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKey = process.env.IK;

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({ error: "Unauthorized: Invalid API key" });
    return;
  }

  next();
};

// API routes
app.post("/run-report", appLimiter, authenticateApiKey, async (req, res) => {
  // This request might take a while to process
  try {
    const {
      // frequency,
      // reportTypes,
      userId,
      notionAccessToken,
      gaAccessToken,
      gaRefreshToken,
      gaPropertyId,
    } = req.body;

    if (!userId) {
      res.status(400).json({
        error: "Missing required fields",
        details: "All user credentials and property IDs are required",
      });
      return;
    }

    // Trigger the report processing task using batchTrigger with a single item
    const runResult = await processUserReport.trigger({
      ga_property_id: gaPropertyId,
      ga_access_token: gaAccessToken,
      ga_refresh_token: gaRefreshToken,
      notion_access_token: notionAccessToken,
      userId: userId,
    });

    res.status(200).json({
      success: true,
      message: "Report generation initiated",
      runId: runResult?.id || "unknown", // Use fallback if id not available
    });
  } catch (error: any) {
    console.error("Error triggering report:", error);
    res.status(500).json({
      error: "Failed to trigger report generation",
      details: error.message || "Unknown error occurred",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server ready to trigger reports on /run-report endpoint`);
});
