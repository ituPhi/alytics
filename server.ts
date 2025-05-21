import express, { Request, Response, NextFunction } from "express";
import { workflow } from "./graph";
import z from "zod";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createHash } from "crypto";
import cookieParser from "cookie-parser";
import timeout from "connect-timeout";

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      apiKeyHash: string;
      timedout: boolean;
    }
  }
}

// Initialize Express app
const app = express();

// Apply security middleware
// Set security headers with Helmet
app.use(helmet());

// Configure CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// Set timeout for all requests
app.use(timeout("120s")); // 2 minute timeout
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (!req.timedout) next();
});

// Parse cookies
app.use(cookieParser());

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/run-report", limiter);

// Parse JSON with size limits
app.use(express.json({ limit: "1mb" }));

const InputSchema = z.object({
  ga_access_token: z.string(),
  ga_refresh_token: z.string(),
  ga_property_id: z.string(),
  notion_access_token: z.string(),
  userId: z.string(),
});

// API Key validation middleware
const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).json({ error: "API key is required" });
    return;
  }

  // Hash the API key to use in logs (don't log raw API keys)
  req.apiKeyHash = createHash("sha256")
    .update(String(apiKey))
    .digest("hex")
    .substring(0, 10);
  next();
};

// Secure endpoint with validation middleware
app.post("/run-report", validateApiKey, async (req: Request, res: Response) => {
  // Log request attempt with hashed API key for audit purposes
  console.log(
    `API request received from: ${req.ip} with key: ${req.apiKeyHash}`,
  );

  // Validate input schema
  const parse = InputSchema.safeParse(req.body);
  if (!parse.success) {
    console.warn(
      `Invalid request schema from ${req.ip}: ${parse.error.message}`,
    );
    res
      .status(400)
      .json({ error: "Invalid request format", details: parse.error.message });
    return;
  }

  const input = parse.data;

  // Sanitize input data for logging (omit sensitive data)
  const sanitizedInput = {
    userId: input.userId,
    ga_property_id: input.ga_property_id,
  };
  console.log(`Processing report for user: ${JSON.stringify(sanitizedInput)}`);

  try {
    // Set a strict timeout for the workflow
    const timeoutPromise = new Promise<any>((_, reject): void => {
      setTimeout(
        (): void => reject(new Error("Workflow execution timed out")),
        110000,
      ); // 110 seconds
    });

    // Race between the workflow and the timeout
    const result = await Promise.race([
      workflow.invoke({
        userId: input.userId,
        ga_property_id: input.ga_property_id,
        ga_access_token: input.ga_access_token,
        ga_refresh_token: input.ga_refresh_token,
        notion_access_token: input.notion_access_token,
      }),
      timeoutPromise,
    ]);

    res.status(200).json({ success: true, result });
    console.log(`Workflow completed successfully for userId: ${input.userId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Workflow error for user ${input.userId}: ${errorMsg}`);

    // Don't expose internal error details in production
    const safeErrorMessage =
      process.env.NODE_ENV === "production"
        ? "An internal error occurred while processing your request"
        : errorMsg;

    res.status(500).json({ error: safeErrorMessage });
  }
});

// Error handling middleware - must be defined after all other middleware and routes
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`Unhandled error: ${err.stack}`);

  // Don't expose stack traces in production
  const errorResponse = {
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  };

  res.status(500).json(errorResponse);
});

// 404 handler for undefined routes
app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: "Resource not found" });
});

// Start server with proper error handling
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(
    `LangGraph Analytics Running on port ${process.env.PORT || 3000}`,
  );
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle process termination gracefully
process.on("SIGTERM", (): void => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close((): void => {
    console.log("HTTP server closed");
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
