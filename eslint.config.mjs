// eslint.config.mjs
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],

        plugins: {
            react,
            "react-hooks": reactHooks,
            prettier: prettierPlugin,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },

        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...prettierConfig.rules,
            "prettier/prettier": ["error", { endOfLine: "auto" }],

            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "react/no-unescaped-entities": "off",
            "react/react-in-jsx-scope": "off",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/preserve-manual-memoization": "warn",
        },
    },
];