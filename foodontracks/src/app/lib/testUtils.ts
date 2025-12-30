/**
 * Testing Utilities for Loading and Error States
 *
 * Use these utilities to test your loading skeletons and error boundaries
 */

/**
 * Simulates a delay to test loading states
 * Usage: await simulateDelay(2000); // 2 second delay
 */
export const simulateDelay = (ms: number = 2000): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Simulates an error to test error boundaries
 * Usage: throw simulateError('Custom error message');
 */
export const simulateError = (
  message: string = "Simulated error for testing"
): Error => {
  return new Error(message);
};

/**
 * Randomly throws an error to simulate unreliable network conditions
 * Usage: randomError(0.3); // 30% chance of error
 */
export const randomError = (probability: number = 0.5): void => {
  if (Math.random() < probability) {
    throw new Error("Random network error occurred");
  }
};

/**
 * Simulates slow loading with possible error
 * Usage: await simulateSlowLoad({ delay: 3000, errorProbability: 0.2 });
 */
export const simulateSlowLoad = async (
  options: {
    delay?: number;
    errorProbability?: number;
    errorMessage?: string;
  } = {}
): Promise<void> => {
  const {
    delay = 2000,
    errorProbability = 0,
    errorMessage = "Failed to load data",
  } = options;

  await simulateDelay(delay);

  if (errorProbability > 0 && Math.random() < errorProbability) {
    throw new Error(errorMessage);
  }
};

/**
 * Example usage in a page component:
 *
 * // Test loading state
 * await simulateDelay(3000);
 *
 * // Test error state
 * if (!data) throw simulateError('Failed to fetch users');
 *
 * // Test random errors
 * randomError(0.3); // 30% chance of error
 *
 * // Test slow load with possible error
 * await simulateSlowLoad({ delay: 2000, errorProbability: 0.2 });
 */

// Network throttling simulation
export const networkConditions = {
  fast: 100,
  "3g": 2000,
  "2g": 5000,
  slow: 8000,
  offline: Infinity,
};

/**
 * Simulates different network conditions
 * Usage: await simulateNetwork('3g');
 */
export const simulateNetwork = async (
  condition: keyof typeof networkConditions
): Promise<void> => {
  const delay = networkConditions[condition];
  if (delay === Infinity) {
    throw new Error("Network offline");
  }
  await simulateDelay(delay);
};
