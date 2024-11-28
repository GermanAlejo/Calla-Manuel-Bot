//import {  } from '@graphql-eslint/eslint-plugin';
import tseslint from 'typescript-eslint';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

/* eslint-env node */
export default [
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ['**/*.ts'], // We use TS config only for TS files
      })),
      {
        files: ['**/*.ts'],
    
        // This is required, see the docs
        languageOptions: {
          parserOptions: {
            parser: typescriptParser,
            project: true,
            tsconfigRootDir: import.meta.dirname,
          },
        },
        // This is needed in order to specify the desired behavior for its rules
        plugins: {
          '@typescript-eslint': typescriptPlugin,
        },
    
        // After defining the plugin, you can use the rules like this
        rules: {
            "no-unused-vars": "error",
            "no-console": "warn",
            "no-undef": "error",
            "quotes": "off",
            "import/no-unresolved": "off",
            "indent": "off",
            "complexity": ["error", { "max": 10 }],
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/naming-convention": "warn",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-shadow": "error",
            "no-undef": "off"
        }
      }
];
