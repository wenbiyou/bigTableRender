#!/usr/bin/env node

/**
 * GitHub Pages 部署验证脚本
 * 运行: node scripts/verify-deploy.js
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const REPO_OWNER = 'wenbiyou';
const REPO_NAME = 'bigTableRender';
const DEPLOY_URL = `https://${REPO_OWNER}.github.io/${REPO_NAME}/`;

console.log('🔍 开始验证 GitHub Pages 部署配置...\n');

// 1. 检查本地配置
console.log('1. 检查本地配置...');
try {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  if (!packageJson.homepage) {
    throw new Error('package.json 中缺少 homepage 字段');
  }
  
  if (packageJson.homepage !== DEPLOY_URL) {
    throw new Error(`homepage 字段应为: ${DEPLOY_URL}, 当前是: ${packageJson.homepage}`);
  }
  
  console.log('✅ package.json 配置正确');
} catch (error) {
  console.error('❌ package.json 配置错误:', error.message);
  process.exit(1);
}

// 2. 检查 Vite 配置
console.log('\n2. 检查 Vite 配置...');
try {
  const viteConfigPath = join(projectRoot, 'vite.config.js');
  if (!existsSync(viteConfigPath)) {
    throw new Error('vite.config.js 文件不存在');
  }
  
  const viteConfigContent = readFileSync(viteConfigPath, 'utf8');
  
  // 检查关键配置
  if (!viteConfigContent.includes("base: process.env.NODE_ENV === 'production' ? '/bigTableRender/' : '/'")) {
    throw new Error('Vite base 配置应为: /bigTableRender/');
  }
  
  console.log('✅ Vite 配置正确');
} catch (error) {
  console.error('❌ Vite 配置错误:', error.message);
  process.exit(1);
}

// 3. 检查 GitHub Actions 配置
console.log('\n3. 检查 GitHub Actions 配置...');
try {
  const workflowPath = join(projectRoot, '.github/workflows/deploy.yml');
  
  if (!existsSync(workflowPath)) {
    throw new Error('GitHub Actions 配置文件不存在');
  }
  
  const workflowContent = readFileSync(workflowPath, 'utf8');
  
  // 检查关键配置
  const checks = [
    { name: '触发分支', check: workflowContent.includes('branches: [ main ]') },
    { name: 'Node.js 版本', check: workflowContent.includes("node-version: '18'") },
    { name: '构建命令', check: workflowContent.includes('npm run build') },
    { name: 'GitHub Pages 部署', check: workflowContent.includes('actions/deploy-pages') },
    { name: '环境变量', check: workflowContent.includes('VITE_BASE_URL: /bigTableRender/') }
  ];
  
  checks.forEach(({ name, check }) => {
    if (!check) {
      throw new Error(`${name} 配置缺失`);
    }
  });
  
  console.log('✅ GitHub Actions 配置正确');
} catch (error) {
  console.error('❌ GitHub Actions 配置错误:', error.message);
  process.exit(1);
}

// 4. 检查 404 页面
console.log('\n4. 检查 404 页面配置...');
try {
  const notFoundPath = join(projectRoot, 'public/404.html');
  
  if (!existsSync(notFoundPath)) {
    throw new Error('404.html 文件不存在');
  }
  
  const notFoundContent = readFileSync(notFoundPath, 'utf8');
  
  if (!notFoundContent.includes('bigTableRender')) {
    throw new Error('404.html 中缺少项目名称');
  }
  
  console.log('✅ 404 页面配置正确');
} catch (error) {
  console.error('❌ 404 页面配置错误:', error.message);
  process.exit(1);
}

// 5. 本地构建测试
console.log('\n5. 运行本地构建测试...');
try {
  console.log('清理之前的构建...');
  execSync('rm -rf dist', { stdio: 'inherit', cwd: projectRoot });
  
  console.log('安装依赖...');
  execSync('npm ci', { stdio: 'inherit', cwd: projectRoot });
  
  console.log('构建项目...');
  execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
  
  // 检查构建输出
  const distIndexPath = join(projectRoot, 'dist/index.html');
  if (!existsSync(distIndexPath)) {
    throw new Error('构建失败: dist/index.html 不存在');
  }
  
  const indexHtml = readFileSync(distIndexPath, 'utf8');
  if (!indexHtml.includes('/bigTableRender/')) {
    throw new Error('构建输出中缺少正确的 base URL');
  }
  
  console.log('✅ 本地构建测试通过');
} catch (error) {
  console.error('❌ 本地构建测试失败:', error.message);
  process.exit(1);
}

console.log('\n🎉 所有配置验证通过！');
console.log('\n📋 下一步操作：');
console.log('1. 提交所有更改到 GitHub:');
console.log('   git add .');
console.log('   git commit -m "ci: 添加 GitHub Pages 自动部署配置"');
console.log('   git push origin main');
console.log('\n2. 在 GitHub 仓库设置中：');
console.log('   - 进入 Settings → Pages');
console.log('   - 选择 Source: GitHub Actions');
console.log('\n3. 部署成功后访问：');
console.log(`   ${DEPLOY_URL}`);
console.log('\n4. 验证部署：');
console.log('   - 访问上述 URL 查看应用');
console.log('   - 刷新页面测试路由');
console.log('   - 检查控制台是否有错误');