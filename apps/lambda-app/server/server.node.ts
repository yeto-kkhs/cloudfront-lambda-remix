import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { logger } from "hono/logger";
import app from "./server";

const nodeApp = new Hono();

if (process.env.NODE_ENV !== "production") {
  nodeApp.use("*", logger());
}

nodeApp.get(
  "/assets/*",
  serveStatic({
    root: "./build/remix/client",
  }),
);
nodeApp.get(
  "/favicon.ico",
  serveStatic({
    path: "./build/remix/client/favicon.ico",
  }),
);

nodeApp.route("/", app);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

serve(
  {
    fetch: nodeApp.fetch,
    port,
  },
  (info) => {
    console.log(`Running on ${info.address}:${info.port}`);
  },
);
