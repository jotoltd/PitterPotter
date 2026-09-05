interface ErrorLogContext {
  functionName: string;
  method?: string;
  url?: string;
  userId?: string;
  ip?: string;
  [key: string]: unknown;
}

export function logError(err: unknown, context: ErrorLogContext): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    stack,
    ...context,
  };

  console.error(JSON.stringify(entry));
}

export function logWarn(message: string, context: Partial<ErrorLogContext> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    ...context,
  };

  console.warn(JSON.stringify(entry));
}

export function logInfo(message: string, context: Partial<ErrorLogContext> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    ...context,
  };

  console.log(JSON.stringify(entry));
}
