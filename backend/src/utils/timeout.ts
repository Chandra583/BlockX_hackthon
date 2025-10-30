import { logger } from './logger';

/**
 * Wrap a promise with a timeout
 * @param promise Promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message to throw on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Execute operations with graceful timeout handling for serverless
 * Returns partial results if some operations timeout
 */
export async function executeWithGracefulTimeout<T>(
  operations: Array<{
    name: string;
    operation: () => Promise<T>;
    timeout: number;
    optional?: boolean;
  }>
): Promise<{ results: Map<string, T | null>; errors: Map<string, Error> }> {
  const results = new Map<string, T | null>();
  const errors = new Map<string, Error>();

  await Promise.allSettled(
    operations.map(async ({ name, operation, timeout, optional = false }) => {
      try {
        const result = await withTimeout(
          operation(),
          timeout,
          `${name} timed out after ${timeout}ms`
        );
        results.set(name, result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.set(name, err);
        results.set(name, null);

        if (optional) {
          logger.warn(`⚠️ Optional operation ${name} failed:`, err.message);
        } else {
          logger.error(`❌ Required operation ${name} failed:`, err.message);
          throw err;
        }
      }
    })
  );

  return { results, errors };
}

/**
 * Check if we're running in a serverless environment with limited execution time
 */
export function isNearTimeout(startTime: number, maxDurationMs: number, bufferMs = 5000): boolean {
  const elapsed = Date.now() - startTime;
  return elapsed >= maxDurationMs - bufferMs;
}

