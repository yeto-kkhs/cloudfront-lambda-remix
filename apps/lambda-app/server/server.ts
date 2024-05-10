import { createRequestHandler } from "@remix-run/node";
import { Hono } from "hono";
import { env } from "hono/adapter";
// @ts-ignore
import * as build from "./remix/server";

const handleRemixRequest = createRequestHandler(build, process.env.NODE_ENV);

const app = new Hono();

app.post("/api", (c) => {
  return c.json({ message: "Hello from Lambda!" });
});

app.mount("/", handleRemixRequest, (c) => {
  return { env: env(c) };
});

export default app;
