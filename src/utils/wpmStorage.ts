/**
 * Utility for managing WPM in localStorage with timestamp tracking
 * WPM is invalidated after 1 hour of inactivity
 */

const WPM_STORAGE_KEY = 'fast-focus-reader-wpm';
const WPM_TIMESTAMP_KEY = 'fast-focus-reader-wpm-timestamp';
const WPM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface WPMStorage {
  wpm: number;
  timestamp: number;
}

/**
 * Get stored WPM if it's still valid (not expired)
 * Returns null if no valid WPM is stored
 */
export function getStoredWPM(): number | null {
  try {
    const wpmStr = localStorage.getItem(WPM_STORAGE_KEY);
    const timestampStr = localStorage.getItem(WPM_TIMESTAMP_KEY);
    
    if (!wpmStr || !timestampStr) {
      return null;
    }
    
    const wpm = parseInt(wpmStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(wpm) || isNaN(timestamp)) {
      return null;
    }
    
    // Check if expired (more than 1 hour since last update)
    const now = Date.now();
    const elapsed = now - timestamp;
    
    if (elapsed > WPM_EXPIRY_MS) {
      // Expired - clear storage
      clearStoredWPM();
      return null;
    }
    
    return wpm;
  } catch (error) {
    // localStorage might not be available
    return null;
  }
}

/**
 * Store WPM with current timestamp
 */
export function storeWPM(wpm: number): void {
  try {
    const timestamp = Date.now();
    localStorage.setItem(WPM_STORAGE_KEY, wpm.toString());
    localStorage.setItem(WPM_TIMESTAMP_KEY, timestamp.toString());
  } catch (error) {
    // localStorage might not be available or quota exceeded
    console.warn('Failed to store WPM:', error);
  }
}

/**
 * Update the timestamp for stored WPM (called when app is in use)
 */
export function updateWPMTimestamp(): void {
  try {
    const wpmStr = localStorage.getItem(WPM_STORAGE_KEY);
    if (wpmStr) {
      const timestamp = Date.now();
      localStorage.setItem(WPM_TIMESTAMP_KEY, timestamp.toString());
    }
  } catch (error) {
    // localStorage might not be available
    console.warn('Failed to update WPM timestamp:', error);
  }
}

/**
 * Clear stored WPM
 */
export function clearStoredWPM(): void {
  try {
    localStorage.removeItem(WPM_STORAGE_KEY);
    localStorage.removeItem(WPM_TIMESTAMP_KEY);
  } catch (error) {
    // localStorage might not be available
    console.warn('Failed to clear stored WPM:', error);
  }
}
