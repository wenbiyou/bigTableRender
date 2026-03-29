import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../index.css';

// Ant Design 5.x 样式导入
import 'antd/dist/reset.css';

// 性能监控
const startTime = performance.now();

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 性能日志
const loadTime = performance.now() - startTime;
console.log(`🚀 应用加载完成，耗时 ${loadTime.toFixed(2)}ms`);
console.log('📊 React测试应用');

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

// 添加未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});