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
    //ignores: ['**/node_modules/', 'src/extended-types/*'],
    // This is required, see the docs
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { 
        __dirname: "readonly",
        process: "readonly"
      }
    },
    // This is needed in order to specify the desired behavior for its rules
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },

    // After defining the plugin, you can use the rules like this
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'no-undef': 'warn',
      'quotes': 'off',
      'import/no-unresolved': 'off',
      'indent': 'off',
      'no-array-constructor': 'off',
      'complexity': ['error', { 'max': 10 }],
      //Typescript rules
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/naming-convention': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/triple-slash-reference': 'error',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-array-delete': 'error',
      '@typescript-eslint/await-thenable': 'error'
    }
  }
];
