/**
 * ESLint 配置文件 - 支持 JavaScript/TypeScript/React
 * 集成 Airbnb 规范 + Prettier + React Hooks
 */

module.exports = {
  // 环境配置
  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // 扩展配置
  extends: [
    // Airbnb JavaScript 规范
    'airbnb',
    // Airbnb React 规范
    'airbnb/hooks',
    // React 推荐配置
    'plugin:react/recommended',
    // 解决 ESLint 与 Prettier 冲突
    'plugin:prettier/recommended',
  ],

  // 解析器配置
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  // 插件配置
  plugins: [
    'react',
    'react-hooks',
    'react-refresh',
    'import',
    'prettier',
  ],

  // 规则配置
  rules: {
    // ========== Prettier 集成规则 ==========
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
        jsxSingleQuote: false,
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'always',
        endOfLine: 'auto',
      },
    ],

    // ========== React 相关规则 ==========
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要引入 React
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/jsx-props-no-spreading': 'off', // 允许 props 展开
    'react/function-component-definition': [
      'error',
      {
        namedComponents: ['function-declaration', 'arrow-function'],
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/require-default-props': 'off', // TypeScript 项目不需要
    'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // ========== Hooks 规则 ==========
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ========== Import/Export 规则 ==========
    'import/prefer-default-export': 'off', // 允许命名导出
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
          '**/vite.config.{js,ts}',
          '**/eslint.config.{js,ts}',
        ],
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // ========== JavaScript 规则 ==========
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'state', // Redux state
          'acc', // Reduce accumulator
          'e', // Event
          'ctx', // Context
          'req', // Request
          'res', // Response
          '$scope', // Angular
        ],
      },
    ],
    'consistent-return': 'off', // 允许不同的返回类型
    'arrow-body-style': ['error', 'as-needed'],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: { multiline: true, consistent: true },
        ObjectPattern: { multiline: true, consistent: true },
        ImportDeclaration: { multiline: true, consistent: true },
        ExportDeclaration: { multiline: true, consistent: true },
      },
    ],

    // ========== JSX 规则 ==========
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
        aspects: ['noHref', 'invalidHref', 'preferButton'],
      },
    ],
  },

  // 文件覆盖配置
  overrides: [
    // TypeScript 文件配置
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        'airbnb',
        'airbnb/hooks',
        'airbnb-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
      },
    },

    // 配置文件特殊规则
    {
      files: [
        '*.config.js',
        '*.config.ts',
        'vite.config.*',
        'eslint.config.*',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off',
      },
    },

    // 测试文件特殊规则
    {
      files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'react/jsx-props-no-spreading': 'off',
        'no-console': 'off',
      },
    },
  ],

  // 设置
  settings: {
    react: {
      version: 'detect', // 自动检测 React 版本
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};