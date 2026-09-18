import eslintConfigPrettier from "eslint-config-prettier/flat";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
  {
    name: "project/ignores",
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
  },
  {
    name: "project/typescript",
    files: ["src/**/*.ts", "test/**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.nodeBuiltin,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
      },
    },
    plugins: {
      perfectionist,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "import-x/first": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-unresolved": "error",
      "import-x/order": "off",
      "no-console": "off",
      "perfectionist/sort-imports": [
        "error",
        {
          order: "asc",
          partitionByComment: true,
          type: "natural",
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        {
          order: "asc",
          type: "natural",
        },
      ],
      "perfectionist/sort-exports": [
        "error",
        {
          order: "asc",
          partitionByComment: true,
          type: "natural",
        },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        {
          order: "asc",
          type: "natural",
        },
      ],
      "perfectionist/sort-union-types": [
        "error",
        {
          order: "asc",
          type: "natural",
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
