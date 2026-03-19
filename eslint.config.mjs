import { defineConfig } from "eslint/config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  // 1. 기본 JS 추천 설정
  js.configs.recommended,

  // 2. legacy 설정을 가져올 때 'plugins' 객체의 참조를 끊어줍니다.
  ...compat.extends("plugin:react/recommended").map(config => ({
    ...config,
    // config.plugins가 존재한다면 새 객체로 복사하여 순환 참조 해제
    plugins: config.plugins ? { ...config.plugins } : {},
  })),
  {
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "next",
      "next/core-web-vitals",
      "plugin:prettier/recommended",
    ),

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      "prettier/prettier": ["error", {
        endOfLine: "auto",
      }],

      "@typescript-eslint/no-empty-interface": 0,
      "@typescript-eslint/no-var-requires": 0,
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
    },
  }
]);
