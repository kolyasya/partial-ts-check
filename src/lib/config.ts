import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// Default configuration paths
export const DEFAULT_WHITELIST_PATH = 'ts-whitelist.js';
export const DEFAULT_BLACKLIST_PATH = 'ts-blacklist.js';
export const DEFAULT_TSCONFIG_PATH = 'tsconfig.json';

const cwd = process.cwd();
const requireFromCwd = createRequire(path.join(cwd, 'package.json'));

/**
 * Loads the consumer's package.json file.
 */
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

/**
 * Resolves a path from the current working directory.
 */
export function resolveFromCwd(...segments: string[]) {
  return path.join(cwd, ...segments);
}

/**
 * Reads a list of file paths from a file.
 * The file can be a .js, .cjs, or .json file, or a plain text file with one path per line.
 */
export function readList(listPath: string): string[] {
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

/**
 * Gets the configuration from the consumer's package.json.
 */
export function getConfig() {
  const pkg = loadConsumerPackageJSON();
  const cfg = pkg['partial-ts-check'] || {};
  return {
    whiteListPath: cfg.whitelist || cfg.whiteList || DEFAULT_WHITELIST_PATH,
    blackListPath: cfg.blacklist || cfg.blackList || DEFAULT_BLACKLIST_PATH,
    printFilesList: cfg.printFilesList ?? true,
    tsconfig: cfg.tsconfig || DEFAULT_TSCONFIG_PATH,
  } as const;
}
