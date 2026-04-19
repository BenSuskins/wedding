import { performance } from "node:perf_hooks";

interface LoadTestConfig {
  baseUrl: string;
  token: string;
  concurrency: number;
  totalRequests: number;
}

interface RequestOutcome {
  status: number;
  latencyMs: number;
  ok: boolean;
}

function readConfig(): LoadTestConfig {
  const baseUrl = process.env.LOAD_BASE_URL ?? "http://localhost:3000";
  const token = process.env.LOAD_INVITE_TOKEN;
  if (!token) {
    throw new Error(
      "LOAD_INVITE_TOKEN is required — paste a signed invite token from /admin/invites",
    );
  }
  const concurrency = Number.parseInt(process.env.LOAD_CONCURRENCY ?? "20", 10);
  const totalRequests = Number.parseInt(process.env.LOAD_TOTAL ?? "500", 10);
  if (!Number.isFinite(concurrency) || concurrency < 1) throw new Error("invalid concurrency");
  if (!Number.isFinite(totalRequests) || totalRequests < 1) throw new Error("invalid total");
  return { baseUrl, token, concurrency, totalRequests };
}

async function issueRequest(config: LoadTestConfig): Promise<RequestOutcome> {
  const started = performance.now();
  try {
    const response = await fetch(`${config.baseUrl}/rsvp/${config.token}`, {
      method: "GET",
      redirect: "manual",
    });
    return {
      status: response.status,
      latencyMs: performance.now() - started,
      ok: response.status < 500,
    };
  } catch {
    return { status: 0, latencyMs: performance.now() - started, ok: false };
  }
}

function summarize(outcomes: ReadonlyArray<RequestOutcome>): void {
  const latencies = outcomes.map((outcome) => outcome.latencyMs).sort((a, b) => a - b);
  const percentile = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
  const byStatus = new Map<number, number>();
  for (const outcome of outcomes) {
    byStatus.set(outcome.status, (byStatus.get(outcome.status) ?? 0) + 1);
  }
  console.log(`requests: ${outcomes.length}`);
  console.log(`latency p50: ${percentile(0.5)?.toFixed(1)}ms`);
  console.log(`latency p95: ${percentile(0.95)?.toFixed(1)}ms`);
  console.log(`latency p99: ${percentile(0.99)?.toFixed(1)}ms`);
  console.log(`status counts:`);
  for (const [status, count] of Array.from(byStatus.entries()).sort()) {
    console.log(`  ${status}: ${count}`);
  }
}

async function main(): Promise<void> {
  const config = readConfig();
  console.log(
    `load-test: ${config.totalRequests} requests, ${config.concurrency} concurrent, target ${config.baseUrl}`,
  );

  const outcomes: RequestOutcome[] = [];
  let issued = 0;

  async function worker(): Promise<void> {
    while (issued < config.totalRequests) {
      issued += 1;
      outcomes.push(await issueRequest(config));
    }
  }

  const started = performance.now();
  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));
  const elapsedSeconds = (performance.now() - started) / 1000;

  console.log(`elapsed: ${elapsedSeconds.toFixed(2)}s`);
  console.log(`throughput: ${(outcomes.length / elapsedSeconds).toFixed(1)} req/s`);
  summarize(outcomes);
}

main().catch((error) => {
  console.error("load-test failed:", error);
  process.exitCode = 1;
});
