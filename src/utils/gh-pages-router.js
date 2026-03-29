/**
 * GitHub Pages 路由适配工具
 * 解决 SPA 在 GitHub Pages 上的路由问题
 */

/**
 * 获取 GitHub Pages 基础路径
 * @returns {string} 基础路径
 */
export function getBasePath() {
  // 生产环境使用配置的 base，开发环境使用 /
  if (process.env.NODE_ENV === 'production') {
    return '/bigTableRender/';
  }
  return '/';
}

/**
 * 适配 React Router 的 basename
 * @returns {string} basename 配置
 */
export function getRouterBasename() {
  return getBasePath();
}

/**
 * 处理 GitHub Pages 的导航
 * @param {string} path - 目标路径
 * @returns {string} 完整的 GitHub Pages 路径
 */
export function navigateTo(path) {
  const base = getBasePath();
  const fullPath = `${base}${path.startsWith('/') ? path.slice(1) : path}`;

  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用完整的 URL
    window.location.href = fullPath;
  } else {
    // 开发环境使用 history API
    window.history.pushState({}, '', fullPath);
  }

  return fullPath;
}

/**
 * 检查当前是否在 GitHub Pages 环境
 * @returns {boolean}
 */
export function isGitHubPages() {
  return window.location.hostname.includes('github.io');
}

/**
 * 初始化 GitHub Pages 路由适配
 * 在应用入口调用
 */
export function initGitHubPagesRouter() {
  if (!isGitHubPages()) {
    return;
  }

  // 处理页面加载时的路由
  const handleInitialRoute = () => {
    const { pathname } = window.location;
    const base = getBasePath();

    // 如果访问的是根路径，重定向到带 base 的路径
    if (pathname === '/' || pathname === '/bigTableRender') {
      window.history.replaceState({}, '', base);
    }

    // 处理 404 页面的重定向
    if (pathname.includes('404.html')) {
      const hash = window.location.hash || '';
      const targetPath = hash.startsWith('#') ? hash.slice(1) : hash;
      window.location.replace(`${base}#${targetPath}`);
    }
  };

  // 页面加载时执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleInitialRoute);
  } else {
    handleInitialRoute();
  }

  // 添加全局错误处理
  window.addEventListener('error', (event) => {
    console.error('GitHub Pages 路由错误:', event.error);
  });

  console.log('GitHub Pages 路由适配已初始化');
}

export default {
  getBasePath,
  getRouterBasename,
  navigateTo,
  isGitHubPages,
  initGitHubPagesRouter,
};
