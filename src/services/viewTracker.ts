import { postService } from './postService';

class ViewTracker {
  private queue: Set<string> = new Set();
  private viewedInSession: Set<string> = new Set();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_SIZE = 15;
  private readonly FLUSH_INTERVAL_MS = 3000; // 3 seconds debounce interval

  /**
   * Track a post view when user dwells on it for >= 1.5s
   */
  public track(postId: string): void {
    if (!postId || typeof postId !== 'string') return;

    // Deduplicate within the current client session
    if (this.viewedInSession.has(postId)) {
      return;
    }

    this.viewedInSession.add(postId);
    this.queue.add(postId);

    if (this.queue.size >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }
  }

  /**
   * Flush queued post view IDs to the backend in batches of max 50
   */
  public async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.size === 0) return;

    // Check if user is authenticated before sending
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      this.queue.clear();
      return;
    }

    // Server constraint: max 50 postIds per batch request
    const postIdsToSend = Array.from(this.queue).slice(0, 50);
    postIdsToSend.forEach((id) => this.queue.delete(id));

    try {
      await postService.logViews(postIdsToSend);
    } catch (err) {
      console.warn('Failed to log views batch:', err);
    }

    // If there are still items remaining in the queue (e.g. > 50 queued), trigger another flush
    if (this.queue.size > 0 && !this.timer) {
      this.timer = setTimeout(() => this.flush(), 1000);
    }
  }

  /**
   * Clear session cache (e.g. on logout or user switch)
   */
  public resetSession(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue.clear();
    this.viewedInSession.clear();
  }
}

export const viewTracker = new ViewTracker();

// Auto-flush when user navigates away, switches tab, or minimises the app
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      viewTracker.flush();
    }
  });

  window.addEventListener('pagehide', () => {
    viewTracker.flush();
  });

  window.addEventListener('beforeunload', () => {
    viewTracker.flush();
  });
}
