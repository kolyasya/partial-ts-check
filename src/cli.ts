#!/usr/bin/env node
import { getConfig, readList } from './lib/config.js';
import { runTsc } from './lib/runner.js';
import { filterErrors } from './lib/processor.js';
import {
  formatWhitelistedErrors,
  formatNonWhitelistedErrors,
} from './lib/formatter.js';

// Minimal declaration to avoid requiring @types/node in this CLI
declare const process: {
  exit(code?: number): never;
};

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
  const { whitelistedErrors, nonWhitelistedErrors } = filterErrors(
    errorLines,
    whiteList,
    blackList
  );

  if (whitelistedErrors.length > 0) {
    formatWhitelistedErrors(whitelistedErrors);
    process.exit(1);
  }

  console.log('✅ No TypeScript errors in whitelisted files.\n\n');

  if (printFilesList && nonWhitelistedErrors.length > 0) {
    formatNonWhitelistedErrors(nonWhitelistedErrors);
  }

  process.exit(0);
}

main();
