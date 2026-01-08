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
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-compiler/react-compiler": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next/*"],
              message: "Domain code cannot import React or Next.js. Keep domain logic pure.",
              from: "src/domain/**",
            },
            {
              group: ["src/features/**", "src/server/**"],
              message: "Domain code cannot import features or server code.",
              from: "src/domain/**",
            },
            {
              group: ["src/features/**"],
              message: "Server code cannot import features.",
              from: "src/server/**",
            },
            {
              group: ["src/server/**"],
              message: "Features cannot import server code directly (use API routes instead).",
              from: "src/features/**",
            },
          ],
        },
      ],
    },
  },
]);
