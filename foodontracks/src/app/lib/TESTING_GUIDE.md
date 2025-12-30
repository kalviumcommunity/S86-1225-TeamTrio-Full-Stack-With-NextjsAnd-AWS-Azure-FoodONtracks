/**
 * Testing Guide: Loading and Error States
 * ========================================
 * 
 * This guide explains how to test the loading skeletons and error boundaries
 * you've implemented in your Next.js application.
 */

// 1. TESTING LOADING STATES
// ==========================

/**
 * Method 1: Add artificial delays in your page components
 * 
 * In any page.tsx file, import the simulateDelay utility:
 */
import { simulateDelay } from '@/app/lib/testUtils';

/**
 * Then add it before your data fetch:
 */
async function UsersPage() {
  // Simulate 3 second loading
  await simulateDelay(3000);
  
  const users = await fetchUsers();
  // ... rest of component
}

// =============================================================================

// 2. TESTING ERROR STATES
// ========================

/**
 * Method 1: Throw an error conditionally
 */
async function UsersPage() {
  const users = await fetchUsers();
  
  if (!users) {
    throw new Error('Failed to load user data');
  }
  
  // ... rest of component
}

/**
 * Method 2: Use the simulateError utility
 */
import { simulateError } from '@/app/lib/testUtils';

async function UsersPage() {
  // Throw error for testing
  throw simulateError('Custom error message for testing');
}

/**
 * Method 3: Use randomError for unreliable conditions
 */
import { randomError } from '@/app/lib/testUtils';

async function UsersPage() {
  randomError(0.5); // 50% chance of error
  
  const users = await fetchUsers();
  // ... rest of component
}

// =============================================================================

// 3. TESTING WITH BROWSER DEVTOOLS
// ==================================

/**
 * Chrome DevTools Network Throttling:
 * 
 * 1. Open Chrome DevTools (F12)
 * 2. Go to the "Network" tab
 * 3. Click the dropdown that says "Online" or "No throttling"
 * 4. Select one of these options:
 *    - Fast 3G: Simulates good mobile connection
 *    - Slow 3G: Simulates poor mobile connection
 *    - Offline: Simulates no connection (will trigger errors)
 * 
 * This will slow down all network requests, allowing you to see
 * your loading skeletons in action.
 */

// =============================================================================

// 4. TESTING WITH REAL API FAILURES
// ===================================

/**
 * Method 1: Use incorrect URL
 */
async function fetchUsers() {
  const res = await fetch('http://localhost:3000/api/wrong-endpoint');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

/**
 * Method 2: Simulate network failure
 */
async function fetchUsers() {
  try {
    const res = await fetch('http://localhost:3000/api/users');
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  } catch (error) {
    throw new Error('Network request failed');
  }
}

// =============================================================================

// 5. COMBINED TESTING EXAMPLE
// =============================

/**
 * Complete example showing both loading and error simulation
 */
import { simulateSlowLoad } from '@/app/lib/testUtils';

async function UsersPage() {
  try {
    // Simulate slow load with 30% chance of error
    await simulateSlowLoad({
      delay: 3000,
      errorProbability: 0.3,
      errorMessage: 'Failed to load users - simulated error'
    });
    
    const users = await fetchUsers();
    
    return (
      <div>
        {/* Your users UI */}
      </div>
    );
  } catch (error) {
    // This will be caught by error.tsx
    throw error;
  }
}

// =============================================================================

// 6. CAPTURING SCREENSHOTS
// =========================

/**
 * Steps to capture evidence:
 * 
 * 1. LOADING STATE:
 *    - Add simulateDelay(3000) to your page
 *    - Refresh the page
 *    - Quickly take a screenshot while loading skeleton is visible
 *    - Or use Slow 3G throttling in DevTools
 * 
 * 2. ERROR STATE:
 *    - Throw an error in your page component
 *    - Take a screenshot of the error boundary
 *    - Click "Try Again" button and capture that interaction
 * 
 * 3. SUCCESS STATE (after retry):
 *    - From error state, click "Try Again"
 *    - Capture the successful load
 * 
 * Tools for recording:
 * - Windows: Win + Shift + S (screenshot)
 * - Chrome: Right-click > Inspect > Capture screenshot
 * - Chrome DevTools: Ctrl + Shift + P > "Capture screenshot"
 * - Screen recording: OBS Studio, Windows Game Bar (Win + G)
 */

// =============================================================================

// 7. TESTING CHECKLIST
// =====================

/**
 * Use this checklist to ensure thorough testing:
 * 
 * ✅ Loading States:
 *    □ Loading skeleton appears immediately on navigation
 *    □ Skeleton matches the structure of loaded content
 *    □ Skeleton is responsive on mobile and desktop
 *    □ Dark mode styling works correctly
 *    □ Animation is smooth (no flashing)
 * 
 * ✅ Error States:
 *    □ Error boundary catches and displays errors
 *    □ Error message is clear and user-friendly
 *    □ "Try Again" button works and re-renders the page
 *    □ "Go Home" or navigation buttons work
 *    □ Error is logged to console
 *    □ Dark mode styling works correctly
 * 
 * ✅ User Experience:
 *    □ Transition from loading to loaded is smooth
 *    □ Transition from error to retry is smooth
 *    □ No layout shift between loading and loaded states
 *    □ All interactive elements are accessible
 */

// =============================================================================

// 8. EXAMPLE TEST COMMANDS
// =========================

/**
 * If using testing libraries, you can write automated tests:
 */

// Example with Playwright or Cypress
test('shows loading skeleton', async ({ page }) => {
  await page.goto('/users');
  // Check if loading skeleton is visible
  await expect(page.locator('[class*="animate-pulse"]')).toBeVisible();
});

test('shows error boundary on failure', async ({ page }) => {
  // Mock API to return error
  await page.route('**/api/users', route => route.abort());
  await page.goto('/users');
  // Check if error message is visible
  await expect(page.getByText('Something went wrong')).toBeVisible();
  // Test retry button
  await page.getByRole('button', { name: 'Try Again' }).click();
});

export {};
