export interface ParsedError {
  file: string;
  line: number;
  col: number;
  code: string;
  msg: string;
}

/**
 * A regex to capture the components of a TypeScript error line.
 * @example
 * // For a line like:
 * // "src/index.ts(1,1): error TS2304: Cannot find name 'x'."
 * // It captures: "src/index.ts", "1", "1", "2304", "Cannot find name 'x'."
 */
const errorHeaderRegex = /^(.*?)(?:\((\d+),(\d+)\))?: error TS(\d{4}): (.*)$/;

/**
 * Parses raw tsc output lines into structured error objects.
 */
export function parseErrors(errorLines: string[]): ParsedError[] {
  const parsedErrors: ParsedError[] = [];
  for (const line of errorLines) {
    const m = errorHeaderRegex.exec(line);
    if (!m) continue;
    const file = m[1];
    const lineNum = Number(m[2] || 0);
    const colNum = Number(m[3] || 0);
    const code = m[4];
    const msg = m[5];
    parsedErrors.push({ file, line: lineNum, col: colNum, code, msg });
  }
  return parsedErrors;
}
