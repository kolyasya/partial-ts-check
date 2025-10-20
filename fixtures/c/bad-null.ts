// Intentional error: strict null checks
function expectString(s: string) {}

// @ts-expect-error
expectString(null);
