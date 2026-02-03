import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: parser,
        },
        plugins: {
            "@typescript-eslint": plugin,
        },
        rules: {
            ...plugin.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "no-restricted-imports": ["error", { "patterns": [{ "group": ["../*"], "message": "Relative parent imports are not allowed. Use absolute paths (e.g., @/utils) instead." }] }]
        }
    },
    prettierConfig
];
