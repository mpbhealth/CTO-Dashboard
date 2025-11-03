// Request throttling utility to prevent 429 (Too Many Requests) errors

interface ThrottleConfig {
  maxRequests: number;
  windowMs: number;
}

class RequestThrottle {
  private requestTimestamps: Map<string, number[]> = new Map();
  private config: ThrottleConfig;

  constructor(config: ThrottleConfig = { maxRequests: 10, windowMs: 1000 }) {
    this.config = config;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(key) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // Check if we're under the limit
    if (validTimestamps.length >= this.config.maxRequests) {
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requestTimestamps.set(key, validTimestamps);

    return true;
  }

  async waitForSlot(key: string): Promise<void> {
    while (!this.canMakeRequest(key)) {
      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  reset(key?: string): void {
    if (key) {
      this.requestTimestamps.delete(key);
    } else {
      this.requestTimestamps.clear();
    }
  }
}

// Global throttle instance
export const globalThrottle = new RequestThrottle({
  maxRequests: 5,
  windowMs: 1000,
});

// Supabase-specific throttle with more conservative limits
export const supabaseThrottle = new RequestThrottle({
  maxRequests: 3,
  windowMs: 1000,
});

// Helper to throttle async functions
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  throttle: RequestThrottle,
  key: string
): T {
  return (async (...args: any[]) => {
    await throttle.waitForSlot(key);
    return fn(...args);
  }) as T;
}

// Debounce utility for form inputs and search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
