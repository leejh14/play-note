const js = require("@eslint/js");
const globals = require("globals");
const nextPlugin = require("@next/eslint-plugin-next");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

const tsRecommendedRules = tsPlugin.configs.recommended.rules;
const nextRecommendedRules = nextPlugin.configs.recommended.rules;
const nextCoreWebVitalsRules = nextPlugin.configs["core-web-vitals"].rules;
const baseTypeScriptRules = {
  ...tsRecommendedRules,
  "no-console": "error",
  "no-undef": "off",
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
};

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.next*/**",
      "**/coverage/**",
      "**/build/**",
      "**/out/**",
      "**/public/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["eslint.config.js"],
    plugins: {
      "@next/next": nextPlugin,
    },
  },
  {
    files: ["apps/api/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: baseTypeScriptRules,
  },
  {
    files: ["apps/api/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...baseTypeScriptRules,
      ...nextRecommendedRules,
      ...nextCoreWebVitalsRules,
    },
  },
];
