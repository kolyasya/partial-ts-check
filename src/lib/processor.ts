import { ParsedError } from './parser.js';

/**
 * Normalizes path separators to forward slashes for consistent matching.
 */
const normalize = (f: string) => f.replace(/\\/g, '/');

/**
 * Filters errors based on whitelist and blacklist.
 */
export function filterErrors(
  errors: string[],
  whiteList: string[],
  blackList: string[]
): {
  whitelistedErrors: ParsedError[];
  nonWhitelistedErrors: string[];
} {
  const nonBlacklistedErrors = errors
    .filter((line) => !blackList.some((file) => line.includes(normalize(file))))
    .filter((line) => line.trim());

  const errorHeaderRegex = /^(.*?)(?:\((\d+),(\d+)\))?: error TS(\d{4}): (.*)$/;
  const isWhiteFile = (file: string) =>
    whiteList.some((f) => normalize(file).includes(normalize(f)));

  const whitelistedErrors: ParsedError[] = [];
  const nonWhitelistedErrors: string[] = [];

  for (const line of nonBlacklistedErrors) {
    const m = errorHeaderRegex.exec(line);
    if (!m) {
      nonWhitelistedErrors.push(line);
      continue;
    }
    const file = m[1];
    if (isWhiteFile(file)) {
      const lineNum = Number(m[2] || 0);
      const colNum = Number(m[3] || 0);
      const code = m[4];
      const msg = m[5];
      whitelistedErrors.push({ file, line: lineNum, col: colNum, code, msg });
    } else {
      nonWhitelistedErrors.push(line);
    }
  }

  return { whitelistedErrors, nonWhitelistedErrors };
}
