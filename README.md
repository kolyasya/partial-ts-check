# partial-ts-check

A tiny CLI that runs `tsc --noEmit` and reports only TypeScript errors from whitelisted files while ignoring blacklisted files. Handy for gradually adopting TypeScript in large repos.

## Install (from GitHub)

Use a direct Git URL (no publish required):

```sh
pnpm add -D github:kolyasya/partial-ts-check
# or
npm i -D github:kolyasya/partial-ts-check
```

**Important:** Make sure you have `typescript` installed in your project:

```sh
pnpm add -D typescript
# or
npm i -D typescript
```

## Configure in your project

Add a `"partial-ts-check"` block to your project’s `package.json`:

```json
{
  "partial-ts-check": {
  "whitelist": "app/scripts/test-lists/default.js",
  "blacklist": "app/scripts/test-lists/blacklist.js",
    "printFilesList": true,
    "tsconfig": "app/tsconfig.json"
  }
}
```

- `whitelist` / `whiteList`: path to a JS/JSON/line-file of file patterns to include
- `blacklist` / `blackList`: path to a JS/JSON/line-file of file patterns to exclude
- `printFilesList` (optional): show short non-whitelisted errors (default: true)
- `tsconfig` (optional): path to your tsconfig (default: `app/tsconfig.json`)

White/black lists can be:

- `.js`/`.cjs` exporting an array
- `.json` array file
- Text file with newline-delimited paths/patterns

## Add a script

```json
{
  "scripts": {
    "ts:partial": "partial-ts-check"
  }
}
```

Then run:

```sh
pnpm ts:partial
```

## How it works

- Resolves and runs your local `node_modules/typescript/bin/tsc` with `--noEmit`
- Parses output, ignores blacklisted files, includes only whitelisted files
- Exits non-zero if there are errors in whitelisted files; otherwise prints a short summary for the rest

**Note:** This tool uses the TypeScript compiler installed in your project, so make sure you have the `typescript` package installed as a dependency.

## Requirements

- Node >= 18
- `typescript` installed in the consuming project

## Local development with fixtures

This repo includes a small fixtures setup to develop and manually test the CLI:

- `fixtures/` has a few TS files, some valid and some intentionally broken
- `tsconfig.fixtures.json` points `tsc` at the fixtures folder
- `test-lists/default.js` and `test-lists/blacklist.js` are default lists used for local runs
- `test-lists/pass.js` only includes files without errors
- `test-lists/fail.js` includes files with errors

Scripts:

- `pnpm run fixtures:tsc` – run raw `tsc` on fixtures (should fail with 3 errors)
- `pnpm run fixtures:partial` – run the built CLI with default `test-lists/default.js` and `test-lists/blacklist.js`
- `pnpm run fixtures:partial:ok` – use `test-lists/pass.js` and expect a success exit code
- `pnpm run fixtures:partial:fail` – use `test-lists/fail.js` and expect a failure exit code

Notes:

- The CLI reads configuration from the project's `package.json` under the `partial-ts-check` key. For the `:ok`/`:fail` scripts we temporarily override the whitelist via `scripts/run-with-whitelist.mjs`.
- If you prefer to run the CLI without rebuilding manually, use `pnpm dev` in another terminal to watch-rebuild and then run the fixture scripts.

### Possible extra dev dependencies

The current setup works with the existing deps. If you want faster iterations, consider:

- `tsx` – to run ESM TS directly without bundling (e.g., for ad-hoc scripts)
- `vitest` – to add automated tests asserting exit codes and output formatting

I didn't add them yet to keep the footprint minimal; happy to wire them up if you want automated tests.
