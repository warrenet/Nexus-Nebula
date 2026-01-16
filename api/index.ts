import { createServer, IncomingMessage, ServerResponse } from "http";
import type { RequestHandler } from "express";
import app from "../server/index";

// Vercel serverless function handler
export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Create a simple HTTP request/response handler using Express
  const expressHandler = app as unknown as RequestHandler;
  return expressHandler(
    req as unknown as Parameters<RequestHandler>[0],
    res as unknown as Parameters<RequestHandler>[1],
    () => {},
  );
}

// Export config for Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};
