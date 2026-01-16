import type { IncomingMessage, ServerResponse } from "http";
import type { RequestHandler } from "express";
import app, { init } from "../server/index";

// Cache initialization promise
let initPromise: Promise<any> | null = null;

// Vercel serverless function handler
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!initPromise) {
    initPromise = init();
  }
  try {
    await initPromise;
  } catch (error) {
    console.error("Initialization failed:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Server Initialization Failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
    return;
  }

  // Create a simple HTTP request/response handler using Express
  const expressHandler = app as unknown as RequestHandler;
  return expressHandler(
    req as unknown as Parameters<RequestHandler>[0],
    res as unknown as Parameters<RequestHandler>[1],
    (err) => {
      if (err) {
        console.error("Express error:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
      // If next is called without error, basic handling is done
    },
  );
}

// Export config for Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};
