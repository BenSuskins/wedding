import { execFileSync } from "node:child_process";

interface PodmanMachineInspect {
  ConnectionInfo?: {
    PodmanSocket?: {
      Path?: string;
    };
  };
}

function detectPodmanSocket(): string | null {
  try {
    const output = execFileSync("podman", ["machine", "inspect"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const machines = JSON.parse(output) as PodmanMachineInspect[];
    return machines[0]?.ConnectionInfo?.PodmanSocket?.Path ?? null;
  } catch {
    return null;
  }
}

if (!process.env.DOCKER_HOST) {
  const socket = detectPodmanSocket();
  if (socket) {
    process.env.DOCKER_HOST = `unix://${socket}`;
  }
}

process.env.TESTCONTAINERS_RYUK_DISABLED =
  process.env.TESTCONTAINERS_RYUK_DISABLED ?? "true";
