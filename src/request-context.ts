import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  apiKey: string | null;
  sessionId?: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => Promise<T> | T): Promise<T> | T {
  // AsyncLocalStorage.run accepts a non-async callback, but supports returning a Promise.
  // We wrap to maintain type-safety without using 'any'.
  let result: Promise<T> | T;
  storage.run(context, () => {
    result = callback();
  });
  // @ts-expect-error result is assigned synchronously by the run callback
  return result;
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}


