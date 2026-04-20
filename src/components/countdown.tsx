"use client";

import { useEffect, useState } from "react";

import { computeCountdown, type CountdownParts } from "@/lib/countdown";

interface CountdownProps {
  targetIsoDate: string;
}

function padTwo(value: number): string {
  return value.toString().padStart(2, "0");
}

export function Countdown({ targetIsoDate }: CountdownProps) {
  const [parts, setParts] = useState<CountdownParts>(() =>
    computeCountdown(new Date(targetIsoDate), new Date()),
  );

  useEffect(() => {
    const target = new Date(targetIsoDate);
    const tick = () => setParts(computeCountdown(target, new Date()));
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => window.clearInterval(handle);
  }, [targetIsoDate]);

  if (parts.hasElapsed) {
    return (
      <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
        The day has arrived
      </p>
    );
  }

  const cells: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Days", value: parts.days.toString() },
    { label: "Hours", value: padTwo(parts.hours) },
    { label: "Minutes", value: padTwo(parts.minutes) },
    { label: "Seconds", value: padTwo(parts.seconds) },
  ];

  return (
    <dl className="flex flex-wrap justify-center gap-6 sm:justify-start sm:gap-10" aria-label="Countdown">
      {cells.map((cell) => (
        <div key={cell.label} className="flex flex-col items-center">
          <dd className="tabular font-serif text-3xl font-light sm:text-4xl">{cell.value}</dd>
          <dt className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
            {cell.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
