#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const normalize = (f: string) => f.replace(/\\/g, '/');

// Default configuration paths
const DEFAULT_WHITELIST_PATH = 'app/scripts/ts-whitelist.js';
const DEFAULT_BLACKLIST_PATH = 'app/scripts/ts-blacklist.js';
const DEFAULT_TSCONFIG_PATH = 'app/tsconfig.json';

// Minimal declaration to avoid requiring @types/node in this CLI
declare const process: {
  cwd(): string;
  exit(code?: number): never;
};

const cwd = process.cwd();
const requireFromCwd = createRequire(path.join(cwd, 'package.json'));

function loadConsumerPackageJSON() {
  const pkgPath = path.join(cwd, 'package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw) as {
    'partial-ts-check'?: {
      // preferred keys
      whitelist?: string;
      whiteList?: string;
      blacklist?: string;
      blackList?: string;
      printFilesList?: boolean;
      tsconfig?: string;
    };
  };
}

function resolveFromCwd(...segments: string[]) {
  return path.join(cwd, ...segments);
}

function readList(listPath: string): string[] {
  const abs = resolveFromCwd(listPath);
  if (!fs.existsSync(abs)) {
    console.log(`ℹ️  List file not found: ${listPath} (will be ignored)`);
    return [];
  }
  if (abs.endsWith('.js') || abs.endsWith('.cjs')) {
    const mod = requireFromCwd(abs);
    return (mod.default || mod) as string[];
  }
  const content = fs.readFileSync(abs, 'utf8');
  try {
    return JSON.parse(content) as string[];
  } catch {
    return content
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
}

function getConfig() {
  const pkg = loadConsumerPackageJSON();
  const cfg = pkg['partial-ts-check'] || {};
  return {
    whiteListPath: cfg.whitelist || cfg.whiteList || DEFAULT_WHITELIST_PATH,
    blackListPath: cfg.blacklist || cfg.blackList || DEFAULT_BLACKLIST_PATH,
    printFilesList: cfg.printFilesList ?? true,
    tsconfig: cfg.tsconfig || DEFAULT_TSCONFIG_PATH,
  } as const;
}

function runTsc(tsconfig: string) {
  const tsconfigPath = resolveFromCwd(tsconfig);
  if (!fs.existsSync(tsconfigPath)) {
    console.error(`❌ TypeScript config file not found: ${tsconfig}`);
    process.exit(1);
  }

  const tscPath = resolveFromCwd('node_modules/typescript/bin/tsc');
  console.log(`ℹ️  Running TypeScript check with config: ${tsconfig}`);

  let output = '';
  try {
    execSync(`${tscPath} --noEmit --project ${tsconfig}`, { stdio: 'pipe' });
    return { ok: true as const, output: '' };
  } catch (error: any) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    output = (stdout + stderr).trim() || error.message;
    return { ok: false as const, output };
  }
}

function groupParsedByFile(
  parsedErrors: Array<{
    file: string;
    line: number;
    col: number;
    code: string;
    msg: string;
  }>
) {
  const map = new Map<string, typeof parsedErrors>();
  for (const e of parsedErrors) {
    if (!map.has(e.file)) map.set(e.file, []);
    map.get(e.file)!.push(e);
  }
  return map;
}

function main() {
  const { whiteListPath, blackListPath, printFilesList, tsconfig } =
    getConfig();

  console.log(`ℹ️  Loading configuration:`);
  console.log(`  - Whitelist: ${whiteListPath}`);
  console.log(`  - Blacklist: ${blackListPath}`);
  console.log(`  - TypeScript config: ${tsconfig}`);

  const whiteList = readList(whiteListPath);
  const blackList = readList(blackListPath);

  console.log(
    `ℹ️  Loaded ${whiteList.length} whitelist pattern(s), ${blackList.length} blacklist pattern(s)`
  );

  const { ok, output } = runTsc(tsconfig);
  if (ok) {
    console.log('✅ No TypeScript errors.');
    process.exit(0);
  }

  const errorLines = output.split('\n').filter(Boolean);
  const nonBlacklistedErrors = errorLines
    .filter((line) => !blackList.some((file) => line.includes(normalize(file))))
    .filter((line) => line.trim());

  const errorHeaderRegex = /^(.*?)(?:\((\d+),(\d+)\))?: error TS(\d{4}): (.*)$/;
  const isWhiteFile = (file: string) =>
    whiteList.some((f) => normalize(file).includes(normalize(f)));

  const parsedWhite: Array<{
    file: string;
    line: number;
    col: number;
    code: string;
    msg: string;
  }> = [];
  for (const line of nonBlacklistedErrors) {
    const m = errorHeaderRegex.exec(line);
    if (!m) continue;
    const file = m[1];
    if (!isWhiteFile(file)) continue;
    const lineNum = Number(m[2] || 0);
    const colNum = Number(m[3] || 0);
    const code = m[4];
    const msg = m[5];
    parsedWhite.push({ file, line: lineNum, col: colNum, code, msg });
  }

  if (parsedWhite.length > 0) {
    console.error(
      `❌ ${parsedWhite.length} TypeScript error(s) found in whitelisted files:`
    );
    const grouped = groupParsedByFile(parsedWhite);
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
    process.exit(1);
  }

  console.log('✅ No TypeScript errors in whitelisted files.\n\n');

  if (printFilesList && nonBlacklistedErrors.length > 0) {
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

    const shortErrorLines = nonBlacklistedErrors.map(getShortErrorLine);
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

  process.exit(0);
}

main();
