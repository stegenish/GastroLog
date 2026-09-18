const windowMs = 15 * 60_000;
const maxAttempts = 5;

export function createLoginLimiter(now: () => number = Date.now) {
  const clients = new Map<string, { attempts: number; updatedAt: number }>();

  return {
    claim(key: string) {
      const time = now();
      const previous = clients.get(key);
      const attempts = previous && time - previous.updatedAt < windowMs
        ? Math.min(previous.attempts + 1, maxAttempts + 1)
        : 1;
      clients.set(key, { attempts, updatedAt: time });
      return attempts <= maxAttempts;
    },
    clear(key: string) {
      clients.delete(key);
    },
  };
}
