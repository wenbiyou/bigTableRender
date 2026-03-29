# 🚀 前端工程化配置完整指南

## 📋 配置概览

本项目已集成完整的现代化前端工程化工具链：

| 工具 | 版本 | 作用 | 状态 |
|------|------|------|------|
| **ESLint** | ^9.0.0 | 代码质量检查 | ✅ 已配置 |
| **Prettier** | ^3.2.5 | 代码格式化 | ✅ 已配置 |
| **Husky** | ^9.0.11 | Git 钩子管理 | ✅ 已配置 |
| **commitlint** | ^19.3.0 | Commit 信息校验 | ✅ 已配置 |
| **lint-staged** | ^15.2.2 | 暂存文件检查 | ✅ 已配置 |

## 🛠️ 一键安装命令

```bash
# 1. 安装所有依赖（包含工程化工具）
npm install

# 2. 初始化 Husky Git 钩子
npm run prepare

# 3. 验证安装成功
npm run check
```

## 📁 配置文件说明

### 1. ESLint 配置 (`.eslintrc.js`)
- **基础规范**: Airbnb JavaScript/React 规范
- **插件集成**: React Hooks、Import、Prettier 兼容
- **规则配置**: 300+ 条代码质量规则
- **TypeScript 支持**: 完整的 TS 类型检查

### 2. Prettier 配置 (`.prettierrc.js`)
- **格式化规则**: 单引号、尾随逗号、100字符换行
- **文件覆盖**: 针对不同文件类型优化配置
- **ESLint 兼容**: 使用官方插件解决规则冲突

### 3. Git 钩子配置 (`.husky/`)
- **pre-commit**: 自动格式化 + ESLint 检查
- **commit-msg**: 强制 Angular Commit 规范
- **性能优化**: 仅检查暂存文件

### 4. Commit 规范 (`.commitlintrc.js`)
- **Angular 规范**: 业界标准 Commit 格式
- **类型检查**: 11种标准 Commit 类型
- **格式验证**: 头部、正文、脚注完整校验

## 🚀 使用指南

### 1. 日常开发流程

```bash
# 1. 创建新功能分支
git checkout -b feat/your-feature

# 2. 开发代码...

# 3. 添加文件到暂存区
git add .

# 4. 提交代码（自动触发格式化+检查）
git commit -m "feat(component): 添加新功能"

# 5. 推送到远程
git push origin feat/your-feature
```

### 2. 代码质量检查

```bash
# 检查所有文件
npm run check

# 自动修复问题
npm run check:fix

# 仅检查 ESLint
npm run lint

# 仅格式化代码
npm run format
```

### 3. Commit 规范示例

```bash
# ✅ 正确的 Commit 格式
git commit -m "feat(table): 添加虚拟滚动功能"
git commit -m "fix(worker): 修复数据加载问题"
git commit -m "docs(readme): 更新项目文档"
git commit -m "style(component): 调整组件样式"
git commit -m "refactor(hooks): 重构自定义 Hook"
git commit -m "test(utils): 添加工具函数测试"

# ❌ 错误的 Commit 格式
git commit -m "update code"                    # 缺少类型
git commit -m "修复bug"                        # 中文，缺少类型
git commit -m "feat: 添加功能"                 # 缺少作用域
git commit -m "feat(component):添加功能"       # 缺少空格
```

### 4. 交互式提交（推荐）

```bash
# 使用交互式 Commit 工具
npm run commit

# 按照提示选择：
# 1. 选择 Commit 类型 (feat/fix/docs等)
# 2. 输入作用域 (component/page/utils等)
# 3. 输入简短描述
# 4. 输入详细描述（可选）
# 5. 输入破坏性变更说明（可选）
# 6. 关联 Issues（可选）
```

## 🔧 配置详解

### ESLint 规则亮点

#### 代码质量
```javascript
// 禁止 console.log，允许 console.warn/error
'no-console': ['warn', { allow: ['warn', 'error'] }]

// 未使用变量检查（忽略以 _ 开头的变量）
'no-unused-vars': ['error', { varsIgnorePattern: '^_' }]

// 禁止 debugger
'no-debugger': 'warn'
```

#### React 规范
```javascript
// React 17+ 不需要引入 React
'react/react-in-jsx-scope': 'off'

// 组件定义方式
'react/function-component-definition': [
  'error',
  {
    namedComponents: ['function-declaration', 'arrow-function'],
    unnamedComponents: 'arrow-function',
  }
]

// Hooks 规则
'react-hooks/rules-of-hooks': 'error'
'react-hooks/exhaustive-deps': 'warn'
```

#### Import 排序
```javascript
// 自动排序 import 语句
'import/order': [
  'error',
  {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
    alphabetize: { order: 'asc', caseInsensitive: true }
  }
]
```

### Prettier 格式化规则

```javascript
{
  printWidth: 100,           // 单行最大长度
  tabWidth: 2,               // 缩进空格数
  useTabs: false,            // 使用空格缩进
  semi: true,                // 语句末尾添加分号
  singleQuote: true,         // 使用单引号
  trailingComma: 'all',      // 尾随逗号
  bracketSpacing: true,      // 对象括号空格
  arrowParens: 'always',     // 箭头函数参数括号
}
```

### Git 钩子工作流程

```bash
# pre-commit 钩子执行流程：
# 1. 运行 lint-staged
# 2. 对暂存文件执行 Prettier 格式化
# 3. 对暂存文件执行 ESLint 检查
# 4. 如果有错误，阻止提交
# 5. 如果通过，允许提交

# commit-msg 钩子执行流程：
# 1. 使用 commitlint 验证 Commit 信息
# 2. 检查是否符合 Angular 规范
# 3. 如果不符合，显示错误提示
# 4. 如果符合，允许提交
```

## 🧪 测试配置

### 1. 验证安装成功

```bash
# 运行完整检查
npm run check

# 预期输出：
# ✅ ESLint 检查通过
# ✅ Prettier 格式化检查通过
# ✅ 所有配置正常
```

### 2. 测试 Git 钩子

```bash
# 1. 创建一个测试文件
echo "console.log('test')" > test.js

# 2. 添加到暂存区
git add test.js

# 3. 尝试提交（应该触发钩子）
git commit -m "test: 测试钩子"

# 预期结果：
# ✅ pre-commit 自动格式化文件
# ✅ ESLint 检查通过
# ✅ commit-msg 验证通过
# ✅ 提交成功
```

### 3. 测试 Commit 规范

```bash
# ✅ 测试正确的 Commit
git commit -m "feat(test): 添加测试用例"

# ❌ 测试错误的 Commit（应该失败）
git commit -m "update"
# 预期：commit-msg 钩子阻止提交，显示错误提示
```

## 🐛 故障排除

### 常见问题

#### Q1: ESLint 和 Prettier 规则冲突
**症状**: 格式化后 ESLint 报错，或 ESLint 修复后格式混乱
**解决方案**:
```bash
# 1. 确保安装了兼容插件
npm list eslint-config-prettier eslint-plugin-prettier

# 2. 检查 .eslintrc.js 配置
# 确保 extends 中包含 'plugin:prettier/recommended'

# 3. 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

#### Q2: Husky 钩子不执行
**症状**: Git 提交时没有触发钩子
**解决方案**:
```bash
# 1. 检查钩子文件权限
ls -la .husky/
# 应该显示可执行权限 (x)

# 2. 重新初始化 Husky
rm -rf .husky
npm run prepare

# 3. 检查 Git 配置
git config core.hooksPath
# 应该指向 .husky
```

#### Q3: Commitlint 验证失败
**症状**: 正确的 Commit 信息也被拒绝
**解决方案**:
```bash
# 1. 检查 Commit 信息格式
# 必须符合: <type>(<scope>): <subject>

# 2. 手动测试 Commitlint
npx commitlint --from HEAD~1 --to HEAD --verbose

# 3. 检查 .commitlintrc.js 配置
```

#### Q4: 性能问题（检查太慢）
**症状**: 提交时等待时间过长
**解决方案**:
```bash
# 1. 确保使用 lint-staged（仅检查暂存文件）
# 2. 检查 .eslintignore 和 .prettierignore
# 3. 排除 node_modules 等目录
# 4. 考虑增加缓存
```

### 调试技巧

```bash
# 1. 查看详细错误信息
npm run lint -- --debug

# 2. 手动运行钩子
npx lint-staged --debug
npx commitlint --edit .git/COMMIT_EDITMSG

# 3. 临时禁用钩子
HUSKY=0 git commit -m "test"

# 4. 查看 Git 钩子日志
cat .husky/pre-commit
cat .husky/commit-msg
```

## 📈 性能优化

### 1. 缓存配置
```json
// package.json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix --max-warnings 0 --cache"  // 启用缓存
  ]
}
```

### 2. 忽略文件优化
```bash
# .eslintignore 和 .prettierignore 中
# 确保包含所有构建产物和依赖目录
dist/
build/
node_modules/
```

### 3. 并行执行
```bash
# 使用 concurrently 并行执行任务
npm install --save-dev concurrently

# package.json
"scripts": {
  "check:parallel": "concurrently \"npm run lint\" \"npm run format:check\""
}
```

## 🔄 工作流集成

### CI/CD 集成

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run check
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

### IDE 集成

#### VSCode 配置
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.enable": true,
  "prettier.enable": true
}
```

#### WebStorm 配置
1. 启用 ESLint 和 Prettier 插件
2. 设置 "Run ESLint on save"
3. 设置 "Run Prettier on save"
4. 配置自动导入排序

## 📚 最佳实践

### 1. 团队协作规范
- 所有成员使用相同的 IDE 配置
- 提交前运行 `npm run check`
- 使用交互式 Commit (`npm run commit`)
- 定期更新依赖 (`npm audit fix`)

### 2. 代码审查要点
- 检查 ESLint 错误是否修复
- 确认代码格式符合 Prettier 规范
- 验证 Commit 信息格式正确
- 确保 import 语句正确排序

### 3. 性能监控
```bash
# 监控检查耗时
time npm run check

# 分析 ESLint 性能
npx eslint . --ext .js,.jsx --debug-performance

# 检查缓存命中率
npx eslint . --ext .js,.jsx --cache --cache-location .eslintcache
```

## 🎯 扩展配置

### 添加 TypeScript 支持
```bash
# 已包含在配置中，如需启用：
# 1. 创建 tsconfig.json
# 2. 将文件扩展名改为 .ts/.tsx
# 3. ESLint 会自动应用 TypeScript 规则
```

### 添加测试框架
```bash
# 安装 Jest
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# 更新 ESLint 配置
# 在 .eslintrc.js 的 overrides 中添加测试文件规则
```

### 添加样式检查
```bash
# 安装 stylelint
npm install --save-dev stylelint stylelint-config-standard

# 创建 .stylelintrc.js
# 添加到 lint-staged 配置
```

## 📞 支持与帮助

### 官方文档
- [ESLint](https://eslint.org/docs/latest/)
- [Prettier](https://prettier.io/docs/en/)
- [Husky](https://typicode.github.io/husky/)
- [commitlint](https://commitlint.js.org/)

### 常见问题
- 查看 `ENGINEERING_SETUP.md` 故障排除部分
- 检查控制台错误信息
- 验证配置文件语法

### 获取帮助
```bash
# 显示所有可用命令
npm run

# 查看工具版本
npx eslint --version
npx prettier --version
npx husky --version
npx commitlint --version
```

---

## ✅ 配置完成检查清单

- [ ] 运行 `npm install` 安装所有依赖
- [ ] 运行 `npm run prepare` 初始化 Husky
- [ ] 运行 `npm run check` 验证配置
- [ ] 测试 Git 提交流程
- [ ] 配置 IDE 自动格式化
- [ ] 团队成员同步配置

**🎉 恭喜！你的项目现在拥有完整的企业级前端工程化配置！**