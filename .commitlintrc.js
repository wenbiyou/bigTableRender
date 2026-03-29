/**
 * commitlint 配置文件
 * 遵循 Angular Commit Message Conventions
 */

module.exports = {
  // 继承 Angular 规范
  extends: ['@commitlint/config-conventional'],
  
  // 自定义规则
  rules: {
    // ========== 类型规则 ==========
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 代码重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建系统或外部依赖
        'ci',       // CI 配置
        'chore',    // 其他修改
        'revert',   // 回退提交
      ],
    ],
    
    // ========== 范围规则 ==========
    'scope-empty': [1, 'never'], // scope 非空警告
    'scope-case': [2, 'always', 'lower-case'], // scope 小写
    
    // ========== 主题规则 ==========
    'subject-empty': [2, 'never'], // subject 不能为空
    'subject-full-stop': [2, 'never', '.'], // 不以句号结尾
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ], // 不限制大小写格式
    'subject-max-length': [2, 'always', 100], // 最大长度 100
    
    // ========== 正文规则 ==========
    'body-leading-blank': [1, 'always'], // 正文前空一行
    'body-max-line-length': [2, 'always', 100], // 正文每行最大长度
    'body-case': [2, 'always', 'sentence-case'], // 正文句子格式
    
    // ========== 脚注规则 ==========
    'footer-leading-blank': [1, 'always'], // 脚注前空一行
    'footer-max-line-length': [2, 'always', 100], // 脚注每行最大长度
    
    // ========== 头部规则 ==========
    'header-max-length': [2, 'always', 100], // 头部最大长度
    'header-case': [2, 'always', 'lower-case'], // 头部小写
    'header-full-stop': [2, 'never', '.'], // 头部不以句号结尾
  },
  
  // 帮助信息
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  
  // 默认问题提示
  defaultIgnores: true,
  
  // 自定义提示信息
  prompt: {
    messages: {
      skip: ':skip',
      max: 'upper %d chars',
      min: '%d chars at least',
      emptyWarning: 'can not be empty',
      upperLimitWarning: 'over limit',
      lowerLimitWarning: 'below limit',
    },
    questions: {
      type: {
        description: "Select the type of change that you're committing:",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: 'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)',
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)',
      },
    },
  },
};