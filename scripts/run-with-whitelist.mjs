#!/usr/bin/env node

// This script temporarily overrides the `whitelist` configuration in package.json
// to run the CLI with a specific whitelist for testing purposes. It restores
// the original package.json after the run.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const [, , whitelistFile] = process.argv;

if (!whitelistFile) {
  console.error('Usage: node scripts/run-with-whitelist.mjs <whitelist-file>');
  process.exit(1);
}

const pkgPath = path.join(repoRoot, 'package.json');
const originalPkgContent = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalPkgContent);

pkg['partial-ts-check'] = {
  ...(pkg['partial-ts-check'] || {}),
  whitelist: whitelistFile,
};

// Replace package.json temporarily so CLI picks up the whitelist override
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

try {
  // Run the CLI using the temp package.json by chdir-ing there
  const result = spawnSync('node', ['dist/cli.js'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });
  process.exit(result.status ?? 1);
} finally {
  // Restore original package.json
  fs.writeFileSync(pkgPath, originalPkgContent);
}
