import { execSync } from 'child_process';
import fs from 'fs';
import { resolveFromCwd } from './config.js';

/**
 * Runs the TypeScript compiler.
 */
export function runTsc(tsconfig: string) {
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
