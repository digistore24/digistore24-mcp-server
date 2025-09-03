// Jest global teardown to force cleanup of any lingering handles
export default function globalTeardown() {
  // Clear any remaining timers
  if (global.clearInterval) {
    // Clear any intervals that might be running
    for (let i = 1; i < 10000; i++) {
      try {
        clearInterval(i);
        clearTimeout(i);
      } catch (e) {
        // Ignore errors
      }
    }
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('Jest teardown completed');
}
