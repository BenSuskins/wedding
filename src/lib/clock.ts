export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export interface FakeClock extends Clock {
  set(date: Date): void;
  advance(ms: number): void;
}

export function createFakeClock(initial: Date = new Date(0)): FakeClock {
  let current = new Date(initial.getTime());
  return {
    now: () => new Date(current.getTime()),
    set: (date) => {
      current = new Date(date.getTime());
    },
    advance: (ms) => {
      current = new Date(current.getTime() + ms);
    },
  };
}
