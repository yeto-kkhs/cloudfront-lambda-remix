import { Hono } from "hono";
import { streamHandle } from "hono/aws-lambda";
import { logger } from "hono/logger";
import app from "./server";

const lambdaApp = new Hono();

if (process.env.NODE_ENV !== "production") {
  lambdaApp.use("*", logger());
}

lambdaApp.route("/", app);

export const handler = streamHandle(lambdaApp);
