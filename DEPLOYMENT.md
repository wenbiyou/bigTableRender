# GitHub Pages 自动部署指南

## 📋 部署概览

- **项目名称**: bigTableRender
- **GitHub 仓库**: https://github.com/wenbiyou/bigTableRender
- **部署地址**: https://wenbiyou.github.io/bigTableRender/
- **部署方式**: GitHub Actions 自动部署
- **触发条件**: 推送到 `main` 分支

## 🚀 快速开始

### 1. 验证本地配置
```bash
npm run deploy:verify
```

### 2. 提交更改到 GitHub
```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 3. 查看部署状态
1. 访问 GitHub 仓库 → Actions 标签页
2. 查看 "Deploy to GitHub Pages" workflow
3. 等待构建完成（约 2-3 分钟）

### 4. 访问部署的应用
- 主页面: https://wenbiyou.github.io/bigTableRender/
- 备用地址: https://wenbiyou.github.io/bigTableRender/index.html

## ⚙️ 配置说明

### GitHub Actions 配置
配置文件: `.github/workflows/deploy.yml`

**关键配置项**:
- **触发条件**: 推送到 `main` 分支
- **构建环境**: Ubuntu Latest + Node.js 18
- **缓存策略**: 依赖缓存加速构建
- **部署方式**: GitHub Pages Actions

### Vite 配置
配置文件: `vite.config.js`

**关键配置项**:
```javascript
base: process.env.NODE_ENV === 'production' ? '/bigTableRender/' : '/',
```

### package.json 配置
**关键字段**:
```json
{
  "homepage": "https://wenbiyou.github.io/bigTableRender/",
  "scripts": {
    "deploy:verify": "验证部署配置",
    "deploy:local": "本地构建测试",
    "deploy:status": "检查部署状态"
  }
}
```

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
**症状**: GitHub Actions 显示红色失败状态
**解决方案**:
```bash
# 本地测试构建
npm run build

# 查看错误日志
npm run build -- --debug
```

#### 2. 页面 404 错误
**症状**: 访问页面显示 404
**解决方案**:
1. 检查 `vite.config.js` 中的 `base` 配置
2. 确保 `package.json` 中的 `homepage` 正确
3. 检查 GitHub Pages 设置中的自定义域名

#### 3. 路由刷新失效
**症状**: 刷新页面后显示 404
**解决方案**:
- 已配置 `public/404.html` 处理 SPA 路由
- 确保使用 HashRouter 或配置正确的重定向

#### 4. 依赖安装失败
**症状**: npm ci 失败
**解决方案**:
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### GitHub 仓库设置

#### 1. 启用 GitHub Pages
1. 访问仓库 Settings → Pages
2. Source 选择: **GitHub Actions**
3. 保存设置

#### 2. 检查 Actions 权限
1. 访问仓库 Settings → Actions → General
2. 确保以下权限开启:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

#### 3. 环境变量配置
如果需要环境变量:
1. 访问仓库 Settings → Secrets and variables → Actions
2. 添加 Repository secrets:
   - `VITE_API_URL`: API 地址
   - `VITE_APP_KEY`: 应用密钥

## 📊 监控与维护

### 部署状态检查
```bash
# 检查部署状态
npm run deploy:status

# 预期输出: 200 (成功)
```

### 构建性能优化
- **依赖缓存**: 已配置 npm 依赖缓存
- **构建缓存**: 可考虑添加 Vite 构建缓存
- **并行构建**: 已配置并发控制

### 安全最佳实践
1. **依赖安全**: 定期运行 `npm audit`
2. **密钥管理**: 敏感信息使用 GitHub Secrets
3. **权限控制**: 最小化 Actions 权限

## 🔄 手动触发部署

### 通过 GitHub UI
1. 访问仓库 Actions 标签页
2. 选择 "Deploy to GitHub Pages" workflow
3. 点击 "Run workflow" → "Run workflow"

### 通过 GitHub CLI
```bash
gh workflow run deploy.yml
```

## 📈 高级配置

### 多环境部署
如需配置多环境（开发/生产）:

1. 修改 `deploy.yml`:
```yaml
jobs:
  deploy:
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
```

2. 添加环境变量:
```yaml
env:
  VITE_BASE_URL: ${{ github.ref == 'refs/heads/main' && '/bigTableRender/' || '/preview/' }}
```

### 自定义域名
如需使用自定义域名:

1. 在 `public/` 目录创建 `CNAME` 文件:
```
your-domain.com
```

2. 更新 Vite 配置:
```javascript
base: process.env.NODE_ENV === 'production' ? '/' : '/',
```

3. 在域名服务商配置 CNAME 记录:
```
your-domain.com CNAME wenbiyou.github.io
```

## 📞 支持

### 获取帮助
1. 查看 GitHub Actions 日志
2. 检查本地构建输出
3. 参考官方文档:
   - [GitHub Pages](https://pages.github.com/)
   - [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
   - [GitHub Actions](https://docs.github.com/en/actions)

### 报告问题
1. 创建 GitHub Issue
2. 提供以下信息:
   - 错误日志
   - 复现步骤
   - 环境信息

---
**最后更新**: 2026-03-29
**维护者**: OpenClaw Assistant