module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'standard-with-typescript',
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    overrides: [],
    parserOptions: {
        project: 'tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    ignorePatterns: [
        '/lib/**/*',
        '/.eslintrc.js',
        '/coverage/**/*'
    ],
    plugins: [
        '@typescript-eslint',
        'import'
    ],
    rules: {
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/no-empty-function': ['error', {
            'allow': ['functions', 'arrowFunctions', 'methods', 'constructors', 'asyncFunctions', 'asyncMethods']
        }],
        '@typescript-eslint/method-signature-style': ['error', 'method'],
        '@typescript-eslint/member-delimiter-style': ['error', {
        multiline: {
        delimiter: 'semi',
        requireLast: true
        }
    }],
        '@typescript-eslint/space-before-function-paren': ['error', 'never'],
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-invalid-void-type': 'off',
        'n/handle-callback-err': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/class-literal-property-style': 'off',
        'curly': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'object-shorthand': ['error', 'never'],
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/space-before-function-paren': 'off',
        'no-async-promise-executor': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off'
    }
  }
    