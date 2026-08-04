/**
 * Next.js instrumentation hook: runs once when the server process starts.
 * Starts the BullMQ worker that processes project imports (pdocs extraction,
 * NexRelay MT, MTQE) inside this same process — the app runs as a single PM2
 * fork, so no separate worker process is needed.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { startImportWorker } = await import(
      "@/modules/projects/import-worker"
    );
    startImportWorker();
    console.log("[instrumentation] Project import worker started");
  } catch (error) {
    // Without the worker uploads still respond, but queued jobs would wait
    // until a restart with Redis available — make that loud.
    console.error(
      "[instrumentation] Could not start the import worker:",
      error?.message ?? error,
    );
  }
}
