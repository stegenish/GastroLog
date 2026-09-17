const windowMs = 15 * 60_000;
const maxFailures = 5;

export function createLoginLimiter(now: () => number = Date.now) {
  const attempts = new Map<string, { failures: number; updatedAt: number; lockedUntil: number }>();

  return {
    isBlocked(key: string) {
      return (attempts.get(key)?.lockedUntil ?? 0) > now();
    },
    recordFailure(key: string) {
      const time = now();
      const previous = attempts.get(key);
      const failures = previous && time - previous.updatedAt < windowMs ? previous.failures + 1 : 1;
      attempts.set(key, { failures, updatedAt: time, lockedUntil: failures >= maxFailures ? time + windowMs : 0 });
    },
    clear(key: string) {
      attempts.delete(key);
    },
  };
}
