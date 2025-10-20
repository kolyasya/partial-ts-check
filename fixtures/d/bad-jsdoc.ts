/**
 * Intentional error: wrong return type in JSDoc
 */
export function strLen(s: string): number {
  return s as unknown as any[]; // nonsense to produce TS error
}
