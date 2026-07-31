/**
 * Lightweight logging helper for AI operations.
 * Isolates console.log usage and provides a single point of entry
 * for future integration with a centralized logging framework.
 */
export const aiLogger = {
  info(event: string, metadata: Record<string, unknown>) {
    // TODO: Replace with project's preferred logging abstraction
    console.log(JSON.stringify({
      level: "info",
      event,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },
  
  error(event: string, metadata: Record<string, unknown>) {
    // TODO: Replace with project's preferred logging abstraction
    console.error(JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }
};
