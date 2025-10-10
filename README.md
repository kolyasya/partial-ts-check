# partial-ts-checker

A tiny CLI that runs `tsc --noEmit` and reports only TypeScript errors from whitelisted files while ignoring blacklisted files. Handy for gradually adopting TypeScript in large repos.

## Install (from GitHub)

Use a direct Git URL (no publish required):

```sh
pnpm add -D github:<owner>/<repo>#<path-to>/partial-ts-checker
# or
npm i -D github:<owner>/<repo>#<path-to>/partial-ts-checker
```

Notes:
- This package builds on install via the `prepare` script. Ensure your environment can run `pnpm` and has Node >= 18.
- Replace `<owner>`, `<repo>`, and `<path-to>` with your repo details. Example:
  `pnpm add -D github:GlyphicSoftware/GSI-Ecomm#partial-ts-checker`

## Configure in your project

Add a `partialTsChecker` block to your project’s `package.json`:

```json
{
  "partialTsChecker": {
    "whitelist": "app/scripts/ts-whitelist.js",
    "blacklist": "app/scripts/ts-blacklist.js",
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
    "ts:partial": "partial-ts-checker"
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

## Requirements
- Node >= 18
- `typescript` installed in the consuming project
- `pnpm` available if installing from Git (to run `prepare`)
