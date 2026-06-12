import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // CLAUDE.md: no `any` to silence TypeScript — use `unknown` + narrowing.
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Design artifacts — not linted:
    "docs/design/**",
    // Static/vendored assets served as-is (e.g. the Draco decoder for the
    // /preview 3D viewer) — third-party minified JS, never linted.
    "public/**",
  ]),
]);

export default eslintConfig;
