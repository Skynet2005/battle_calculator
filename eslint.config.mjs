import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "**/.next/**",
      ".worktrees/**",
      "**/.worktrees/**",
      "**/__tests__/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "temp/**",
      "scripts/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-compiler/react-compiler": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "Domain code cannot import React or Next.js. Keep domain logic pure." },
            { name: "react-dom", message: "Domain code cannot import React or Next.js. Keep domain logic pure." },
          ],
          patterns: [
            { group: ["next/*"], message: "Domain code cannot import Next.js. Keep domain logic pure." },
            { group: ["@/features/*", "@/features/**"], message: "Domain code cannot import features or server code." },
            { group: ["@/server/*", "@/server/**"], message: "Domain code cannot import features or server code." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/features/*", "@/features/**"], message: "Server code cannot import features." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/server/*", "@/server/**"], message: "Features cannot import server code directly (use API routes instead)." },
          ],
        },
      ],
    },
  },
]);
