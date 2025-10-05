const tseslint = require('typescript-eslint');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

/* eslint-env node */
module.exports = [
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
        tsconfigRootDir: __dirname,
      },
      globals: {
        __dirname: "readonly",
        process: "readonly",
        __filename: "readonly"
      }
    },
    // This is needed in order to specify the desired behavior for its rules
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'prettier': prettierPlugin,
      'import': importPlugin
    },
    // After defining the plugin, you can use the rules like this
    rules: {
      'no-undef': 'warn',
      'import/no-unresolved': 'off',
      'complexity': ['error', { 'max': 18 }],
      //Typescript rules
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-array-delete': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'prettier/prettier': [
        'off',//THIS COUSES SEVERAL ERRORS WHICH ARE NOT FIXABLE
        {
          endOfLine: 'auto', // Align with Prettier configuration
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': [
        'warn',
        { allow: ['warn', 'error'] }
      ],
      'import/no-unused-modules': ["warn"],
      'import/order': [
        "warn",
        {
          'groups': [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index']
          ],
          'newlines-between': 'always',
        },
      ],
    }
  }
];
