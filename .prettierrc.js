/**
 * Prettier 配置文件
 * 与 ESLint 完全兼容，解决规则冲突
 */

module.exports = {
  // ========== 基础格式化配置 ==========
  
  // 单行最大长度
  printWidth: 100,
  
  // 缩进空格数
  tabWidth: 2,
  
  // 使用空格缩进
  useTabs: false,
  
  // 语句末尾添加分号
  semi: true,
  
  // 使用单引号
  singleQuote: true,
  
  // 对象属性使用引号 (as-needed: 仅在需要时)
  quoteProps: 'as-needed',
  
  // JSX 使用双引号
  jsxSingleQuote: false,
  
  // 尾随逗号 (all: 尽可能添加)
  trailingComma: 'all',
  
  // ========== 括号配置 ==========
  
  // 对象字面量括号空格
  bracketSpacing: true,
  
  // JSX 标签闭合括号位置 (false: 单独一行)
  bracketSameLine: false,
  
  // 箭头函数参数括号 (always: 始终添加)
  arrowParens: 'always',
  
  // ========== 文件格式配置 ==========
  
  // 文件顶部插入特殊格式指令
  insertPragma: false,
  
  // 仅对包含特殊格式指令的文件进行格式化
  requirePragma: false,
  
  // ========== 换行配置 ==========
  
  // 行结束符 (auto: 自动检测)
  endOfLine: 'auto',
  
  // HTML 空白敏感度 (css: 遵循 CSS display 属性)
  htmlWhitespaceSensitivity: 'css',
  
  // Vue 文件 script 和 style 标签缩进
  vueIndentScriptAndStyle: false,
  
  // ========== 特殊文件配置 ==========
  
  // 嵌入式语言格式化
  embeddedLanguageFormatting: 'auto',
  
  // 单属性换行
  singleAttributePerLine: false,
  
  // ========== 覆盖配置 ==========
  
  // 文件覆盖配置
  overrides: [
    // JSON 文件配置
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    
    // Markdown 文件配置
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    
    // YAML 文件配置
    {
      files: '*.yaml',
      options: {
        singleQuote: false,
      },
    },
    
    // HTML 文件配置
    {
      files: '*.html',
      options: {
        printWidth: 120,
      },
    },
    
    // CSS/SCSS/Less 文件配置
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false,
      },
    },
  ],
};