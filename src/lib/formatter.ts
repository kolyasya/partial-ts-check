import { ParsedError } from './parser.js';

/**
 * Groups parsed errors by file.
 */
function groupParsedByFile(parsedErrors: ParsedError[]) {
  const map = new Map<string, ParsedError[]>();
  for (const e of parsedErrors) {
    if (!map.has(e.file)) map.set(e.file, []);
    map.get(e.file)!.push(e);
  }
  return map;
}

/**
 * Formats and prints whitelisted errors.
 */
export function formatWhitelistedErrors(whitelistedErrors: ParsedError[]) {
  console.error(
    `❌ ${whitelistedErrors.length} TypeScript error(s) found in whitelisted files:`
  );
  const grouped = groupParsedByFile(whitelistedErrors);
  const files = Array.from(grouped.keys()).sort();
  const out: string[] = [];
  for (const file of files) {
    out.push(file);
    const errs = grouped
      .get(file)!
      .sort((a, b) => a.line - b.line || a.col - b.col);
    for (const e of errs) {
      out.push(`  (${e.line},${e.col}): error TS${e.code}: ${e.msg}`);
    }
    out.push('');
  }
  console.error(out.join('\n').trim());
}

/**
 * Formats and prints non-whitelisted errors.
 */
export function formatNonWhitelistedErrors(nonWhitelistedErrors: string[]) {
  const getShortErrorLine = (() => {
    const seen = new Set<string>();
    const tsErrorRegex = /^(.*): error TS(\d{4})/;
    return (line: string) => {
      const match = line.match(tsErrorRegex);
      if (match) {
        const key = `${match[1]}: error TS${match[2]}`;
        if (!seen.has(key)) {
          seen.add(key);
          return key;
        }
      }
      return undefined;
    };
  })();

  const sortLinesByFile = (lines: string[]) => {
    const getFile = (line: string) =>
      line.match(/^(.*?)(\(\d+,\d+\))?: error TS\d{4}/)?.[1] || '';
    return [...lines].sort((a, b) => getFile(a).localeCompare(getFile(b)));
  };

  const groupLinesByFolder = (lines: (string | undefined)[]) => {
    const defined = lines.filter(Boolean) as string[];
    const getFolder = (line: string) =>
      line.match(/^(.*\/)? .*?: error TS\d{4}/)?.[1] || '';
    const getFile = (line: string) =>
      line.match(/^(.*?)(\(\d+,\d+\))?: error TS\d{4}/)?.[1] || '';
    let lastFolder = '',
      lastFile = '';
    return defined.reduce((acc: string[], line: string) => {
      const folder = getFolder(line);
      const file = getFile(line);
      if (lastFolder && folder !== lastFolder) acc.push('', '');
      else if (lastFile && file !== lastFile) acc.push('');
      acc.push(line);
      lastFolder = folder;
      lastFile = file;
      return acc;
    }, []);
  };

  const shortErrorLines = nonWhitelistedErrors.map(getShortErrorLine);
  const errorCount = shortErrorLines.filter(Boolean).length;
  if (errorCount > 0) {
    const groupedLines = groupLinesByFolder(
      sortLinesByFile(shortErrorLines.filter(Boolean) as string[])
    );
    console.log(groupedLines.join('\n'), '\n\n');
    console.log(
      `ℹ️  Found ${errorCount} TypeScript error(s) (excluding blacklisted files)`,
      '\n\n'
    );
  }
}
