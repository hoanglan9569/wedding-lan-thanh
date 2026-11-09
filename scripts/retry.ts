import type { Locator } from "playwright";
import { Timeout } from "./timeout";

export const READY_TIMEOUT_MS = Timeout.DEFAULT;

export type RetryOptions = {
  /** Total budget in ms. Default READY_TIMEOUT_MS. */
  timeout?: number;
  /** Pause between attempts in ms. Default 500. */
  interval?: number;
  /** Error message on timeout; name the step and the subject. */
  message?: string;
};

/**
 * Call `condition` until it returns a value that is not `undefined`, `null` or
 * `false`, and return that value; throw `message` when `timeout` runs out.
 */
export async function retryUntil<T>(
  condition: () => Promise<T | undefined | null | false>,
  options: RetryOptions = {},
): Promise<T> {
  const timeout = options.timeout ?? READY_TIMEOUT_MS;
  const interval = options.interval ?? 500;
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await condition();
    if (value !== undefined && value !== null && value !== false) return value as T;
    if (Date.now() + interval >= deadline) break;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(options.message ?? `retryUntil: condition not met within ${timeout} ms`);
}

/**
 * Whether `locator` becomes visible within `timeout` ms.
 */
export async function appears(locator: Locator, timeout: number = Timeout.SHORT): Promise<boolean> {
  return locator.waitFor({ state: "visible", timeout }).then(
    () => true,
    () => false,
  );
}
