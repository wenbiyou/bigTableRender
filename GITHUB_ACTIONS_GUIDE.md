# GitHub Actions 自动部署完整指南

## 🎯 部署目标
- **仓库**: `wenbiyou/bigTableRender`
- **部署地址**: `https://wenbiyou.github.io/bigTableRender/`
- **技术栈**: Vite + React + GitHub Pages

## 📁 配置文件结构
```
.github/
└── workflows/
    └── deploy.yml          # GitHub Actions 工作流配置
public/
├── 404.html               # GitHub Pages 404 页面适配
└── index.html            # 主页面
src/
└── utils/
    └── gh-pages-router.js # GitHub Pages 路由适配工具
scripts/
└── verify-deploy.js      # 部署验证脚本
vite.config.js            # Vite 构建配置
package.json              # 项目配置（含 homepage 字段）
DEPLOYMENT.md             # 部署文档
GITHUB_ACTIONS_GUIDE.md   # 本指南
```

## ⚙️ 核心配置文件详解

### 1. `.github/workflows/deploy.yml` - GitHub Actions 工作流
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]      # main 分支推送时触发
  workflow_dispatch:        # 支持手动触发

permissions:
  contents: read           # 读取仓库内容
  pages: write            # 写入 GitHub Pages
  id-token: write         # 身份验证

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'  # 使用 Node.js 18
          cache: 'npm'        # 启用 npm 缓存
      
      - name: Install dependencies
        run: npm ci          # 使用 package-lock.json 精确安装
      
      - name: Build
        run: npm run build   # 执行构建
        env:
          VITE_BASE_URL: /bigTableRender/  # 设置基础路径
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist       # 上传构建产物
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        uses: actions/deploy-pages@v4  # 部署到 GitHub Pages
```

### 2. `vite.config.js` - Vite 构建配置
```javascript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/bigTableRender/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {      # 代码分割优化
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          reactWindow: ['react-window']
        }
      }
    }
  }
})
```

### 3. `package.json` - 关键配置
```json
{
  "name": "big-table-render",
  "homepage": "https://wenbiyou.github.io/bigTableRender/",
  "scripts": {
    "build": "vite build",
    "deploy:verify": "node scripts/verify-deploy.js",
    "deploy:status": "curl -s -o /dev/null -w '%{http_code}' https://wenbiyou.github.io/bigTableRender/"
  }
}
```

### 4. `public/404.html` - SPA 路由适配
```html
<script>
  // 自动重定向到正确的 SPA 路由
  const path = window.location.pathname;
  const repoName = 'bigTableRender';
  
  if (path.includes('/' + repoName + '/')) {
    const appPath = path.split('/' + repoName + '/')[1] || '';
    window.location.href = '/' + repoName + '/#' + appPath;
  }
</script>
```

## 🚀 部署流程

### 步骤 1: 验证本地配置
```bash
# 运行验证脚本
npm run deploy:verify

# 预期输出:
# ✅ package.json 配置正确
# ✅ Vite 配置正确  
# ✅ GitHub Actions 配置正确
# ✅ 404 页面配置正确
# ✅ 本地构建测试通过
# 🎉 所有配置验证通过！
```

### 步骤 2: 提交代码到 GitHub
```bash
# 添加所有更改
git add .

# 提交更改（使用符合规范的 commit 信息）
git commit -m "ci: 配置 GitHub Pages 自动部署"

# 推送到 main 分支
git push origin main
```

### 步骤 3: 配置 GitHub 仓库

#### 3.1 启用 GitHub Pages
1. 访问仓库: `https://github.com/wenbiyou/bigTableRender`
2. 点击 **Settings** → **Pages**
3. 在 **Build and deployment** 部分:
   - Source: **GitHub Actions**
   - 保存设置

#### 3.2 检查 Actions 权限
1. Settings → Actions → General
2. 确保以下设置:
   - ✅ Actions permissions: **Allow all actions**
   - ✅ Workflow permissions: **Read and write permissions**
   - ✅ Fork pull request workflows: **Require approval**

### 步骤 4: 监控部署状态

#### 4.1 查看 Actions 运行
1. 访问仓库的 **Actions** 标签页
2. 查看 **Deploy to GitHub Pages** workflow
3. 点击运行记录查看详细日志

#### 4.2 构建阶段监控
- ✅ **Checkout**: 代码检出
- ✅ **Setup Node.js**: 环境设置
- ✅ **Install dependencies**: 依赖安装（使用缓存）
- ✅ **Build**: 项目构建（约 30-60 秒）
- ✅ **Upload artifact**: 上传构建产物

#### 4.3 部署阶段监控
- ✅ **Deploy to GitHub Pages**: 部署到 GitHub Pages
- ✅ **Environment**: `github-pages`
- ✅ **URL**: 显示部署后的访问地址

### 步骤 5: 验证部署结果

#### 5.1 检查部署状态
```bash
# 使用脚本检查
npm run deploy:status
# 预期输出: 200

# 手动检查
curl -I https://wenbiyou.github.io/bigTableRender/
# 预期响应: HTTP/2 200
```

#### 5.2 访问部署的应用
- 主页面: https://wenbiyou.github.io/bigTableRender/
- 备用地址: https://wenbiyou.github.io/bigTableRender/index.html

#### 5.3 功能验证清单
- [ ] 页面正常加载
- [ ] 样式正确显示
- [ ] JavaScript 功能正常
- [ ] 路由导航正常
- [ ] 页面刷新正常（无 404）
- [ ] 控制台无错误

## 🔧 故障排除

### 问题 1: 构建失败
**错误信息**: `npm run build` 失败
**解决方案**:
```bash
# 1. 本地测试构建
npm run build

# 2. 检查依赖
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 3. 检查环境变量
echo $NODE_ENV
```

### 问题 2: 页面 404
**症状**: 访问页面显示 404
**解决方案**:
1. 检查 `vite.config.js` 中的 `base` 配置
2. 检查 `package.json` 中的 `homepage` 字段
3. 验证 GitHub Pages 设置
4. 检查 `public/404.html` 文件

### 问题 3: 路由刷新失效
**症状**: 刷新页面后显示空白或 404
**解决方案**:
1. 确保使用 HashRouter（推荐用于 GitHub Pages）
2. 检查 `gh-pages-router.js` 是否正确初始化
3. 验证 `404.html` 的重定向逻辑

### 问题 4: 资源加载失败
**症状**: CSS/JS 文件 404
**解决方案**:
1. 检查构建输出的 `dist` 目录结构
2. 验证资源路径是否正确
3. 检查 Vite 的 `base` 配置

### 问题 5: Actions 权限不足
**错误信息**: `Permission denied`
**解决方案**:
1. Settings → Actions → General
2. Workflow permissions: **Read and write permissions**
3. 保存设置并重新运行 workflow

## 📊 性能优化

### 构建优化
- **依赖缓存**: 使用 `actions/cache` 缓存 `node_modules`
- **构建缓存**: 可考虑添加 Vite 构建缓存
- **并行构建**: 配置并发控制

### 部署优化
- **增量部署**: 只部署更改的文件
- **CDN 加速**: 考虑使用 Cloudflare CDN
- **压缩优化**: 启用 Gzip/Brotli 压缩

### 监控优化
- **健康检查**: 定期检查部署状态
- **性能监控**: 监控页面加载性能
- **错误追踪**: 集成错误监控服务

## 🔄 手动操作指南

### 手动触发部署
```bash
# 使用 GitHub CLI
gh workflow run deploy.yml

# 或通过 GitHub UI
# 1. 访问 Actions 标签页
# 2. 选择 "Deploy to GitHub Pages"
# 3. 点击 "Run workflow"
```

### 回滚部署
```bash
# 1. 回退到之前的 commit
git revert HEAD
git push origin main

# 2. 或使用特定的 commit
git checkout <commit-hash>
git push origin main --force
```

### 清理部署
```bash
# 删除 GitHub Pages 部署
# Settings → Pages → 删除站点

# 清理本地构建
npm run clean
```

## 📈 高级配置

### 多环境部署
```yaml
# 在 deploy.yml 中添加
jobs:
  deploy:
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
```

### 自定义域名
1. 创建 `public/CNAME` 文件:
```
your-domain.com
```

2. 更新 Vite 配置:
```javascript
base: '/'
```

3. 配置 DNS:
```
your-domain.com CNAME wenbiyou.github.io
```

### 环境变量管理
```yaml
# 在 deploy.yml 中添加
env:
  VITE_API_URL: ${{ secrets.API_URL }}
  VITE_APP_KEY: ${{ secrets.APP_KEY }}
```

## 📞 支持与资源

### 官方文档
- [GitHub Pages](https://pages.github.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

### 调试工具
```bash
# 查看构建产物
ls -la dist/

# 检查页面响应
curl -v https://wenbiyou.github.io/bigTableRender/

# 查看浏览器控制台
# 按 F12 打开开发者工具
```

### 获取帮助
1. 查看 GitHub Actions 日志
2. 检查本地构建输出
3. 提交 GitHub Issue
4. 参考本指南

---
**配置状态**: ✅ 已验证可用
**最后测试**: 2026-03-29
**维护者**: OpenClaw Assistant
**仓库**: https://github.com/wenbiyou/bigTableRender