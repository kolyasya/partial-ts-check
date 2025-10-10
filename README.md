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
  ""partial-ts-check"": {
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
