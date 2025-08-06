/**
 * Option 1: Server-Sent Events (SSE) - Simplest approach
 * Add this to your webhook handler to notify the frontend
 */

// In webhook route.ts, after successful sync:
async function notifyFrontend(userId: string, updateType: string) {
  // Broadcast update to connected clients
  // You could use a simple in-memory store or Redis for production
  
  // Example with a hypothetical SSE implementation:
  // await broadcastSSE(userId, { type: updateType, timestamp: new Date() });
}

/**
 * Option 2: Polling with smart caching
 * Frontend checks for updates periodically but only when tab is active
 */

// In your financial store:
const useFinancialStore = create((set, get) => ({
  // ... existing state ...
  
  // Check for updates every 30 seconds when tab is active
  startPolling: () => {
    const pollInterval = setInterval(async () => {
      if (document.hidden) return; // Skip if tab not active
      
      const lastSync = get().lastSync;
      if (!lastSync) return;
      
      // Check if server has newer data
      const response = await fetch(`/api/data-version?since=${lastSync.getTime()}`);
      const { hasUpdates } = await response.json();
      
      if (hasUpdates) {
        console.log('🔄 New data available, refreshing...');
        get().refreshData();
      }
    }, 30000); // 30 seconds
    
    set({ pollInterval });
  },
  
  stopPolling: () => {
    const { pollInterval } = get();
    if (pollInterval) {
      clearInterval(pollInterval);
      set({ pollInterval: null });
    }
  }
}));

/**
 * Option 3: WebSocket/SSE for instant updates
 * Most sophisticated but requires more infrastructure
 */
