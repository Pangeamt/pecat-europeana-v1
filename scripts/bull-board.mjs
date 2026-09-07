// Dev-only queue inspector: `pnpm queues` then open http://localhost:3010.
// Shows both Bull queues (project-import and mtqe-v2) on the same Redis the
// app uses (REDIS_URL from .env) — jobs, states, payloads, retries, and
// manual actions (retry/remove/clean). Not part of the Next app on purpose:
// it points at the same Redis, so it can run anywhere the queue is reachable.
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import express from "express";
import { readFileSync } from "node:fs";

// Minimal .env loader (dotenv is not a dependency of this project).
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].trim();
  }
} catch {
  /* no .env — fall back to defaults */
}

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const PORT = Number(process.env.BULL_BOARD_PORT || 3010);

const url = new URL(REDIS_URL);
const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
  db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
  tls: url.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null,
};

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

// Swallow transient Redis errors (reconnects are automatic); without a
// listener one 'error' event kills the process.
const makeQueue = (name) => {
  const queue = new Queue(name, { connection });
  queue.on("error", (error) =>
    console.warn(`[bull-board] ${name}: ${error?.message ?? error}`),
  );
  return queue;
};

createBullBoard({
  queues: [
    new BullMQAdapter(makeQueue("project-import")),
    new BullMQAdapter(makeQueue("mtqe-v2")),
  ],
  serverAdapter,
});

// Keep the UI alive through Redis blips: ioredis surfaces some connection
// errors outside the queue 'error' event, and one uncaught kills the board.
process.on("uncaughtException", (error) =>
  console.warn(`[bull-board] uncaught: ${error?.message ?? error}`),
);
process.on("unhandledRejection", (error) =>
  console.warn(`[bull-board] unhandled: ${error?.message ?? error}`),
);

const app = express();
app.use("/", serverAdapter.getRouter());
app.listen(PORT, () => {
  console.log(`Bull Board on http://localhost:${PORT} (redis: ${url.hostname}:${url.port || 6379})`);
});
