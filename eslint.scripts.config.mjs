// ESLint configuration for scripts/ directory (Node.js maintenance scripts)
// Separate from main config to avoid React/Next.js rule conflicts

import tseslint from "typescript-eslint";

export default [
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        project: null, // Don't require tsconfig for scripts
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-console": "off", // Allow console in scripts
      "no-unused-vars": "off", // TypeScript handles this
      "no-undef": "off", // TypeScript handles this
    },
  },
];
