// eslint.config.mjs
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        // generated 는 openapi-generator 산출물이라 손대지 않는다.
        // 내부 상대경로(../base 등)는 모두 generated 폴더 안을 가리키므로 그대로 두어도 안전하다.
        ignores: ["generated/**"],
    },
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

            // 상위 디렉터리 상대경로(../) import 금지 → tsconfig 의 "@/*" 별칭 사용 강제.
            // 같은 폴더(./) 참조는 허용한다.
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["../*"],
                            message: "상위 경로 import 대신 '@/' 별칭을 사용하세요. 예) '../../generated' → '@/generated'",
                        },
                    ],
                },
            ],
        },
    },
];