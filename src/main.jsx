import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import EnhancedApp from './EnhancedApp.jsx';

// Ant Design 5.x 样式导入
import 'antd/dist/reset.css';

// 性能监控
const startTime = performance.now();

// 版本选择器组件
function VersionSelector() {
  const [selectedVersion, setSelectedVersion] = React.useState(() => {
    // 从URL参数或localStorage读取版本选择
    const params = new URLSearchParams(window.location.search);
    const savedVersion = localStorage.getItem('bigtable-version');
    return params.get('version') || savedVersion || 'enhanced';
  });

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    localStorage.setItem('bigtable-version', version);

    // 更新URL但不刷新页面
    const url = new URL(window.location);
    url.searchParams.set('version', version);
    window.history.replaceState({}, '', url);
  };

  const versions = [
    {
      id: 'enhanced',
      name: '增强版',
      description: '包含筛选、多列排序、数据导出等高级功能',
      features: ['数据筛选', '多列排序', '数据导出', '虚拟滚动', 'Web Worker'],
      color: '#1890ff',
    },
    {
      id: 'basic',
      name: '基础版',
      description: '基础虚拟滚动和单列排序功能',
      features: ['虚拟滚动', '单列排序', 'Web Worker'],
      color: '#52c41a',
    },
  ];

  if (selectedVersion === 'basic') {
    return <App />;
  }

  if (selectedVersion === 'enhanced') {
    return <EnhancedApp />;
  }

  // 版本选择界面
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '8px',
            color: '#1890ff',
            fontSize: '32px',
          }}
        >
          🚀 大数据表格渲染引擎
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '40px',
            fontSize: '16px',
          }}
        >
          选择您要使用的版本，开始体验高性能大数据表格
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {versions.map((version) => (
            <div
              key={version.id}
              onClick={() => handleVersionSelect(version.id)}
              style={{
                border: `2px solid ${selectedVersion === version.id ? version.color : '#e8e8e8'}`,
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: selectedVersion === version.id ? `${version.color}10` : 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: version.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    color: 'white',
                    fontSize: '24px',
                  }}
                >
                  {version.id === 'enhanced' ? '⚡' : '📊'}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '20px',
                      color: version.color,
                    }}
                  >
                    {version.name}
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      color: '#999',
                      fontSize: '14px',
                    }}
                  >
                    {version.description}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  功能特性:
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {version.features.map((feature) => (
                    <span
                      key={feature}
                      style={{
                        padding: '4px 12px',
                        background: `${version.color}20`,
                        color: version.color,
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: '#f6ffed',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#52c41a',
                    textAlign: 'center',
                  }}
                >
                  {version.id === 'enhanced'
                    ? '💡 推荐: 包含所有高级功能，适合生产环境使用'
                    : '🎯 轻量: 基础功能，适合学习和演示'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            background: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#999',
              fontSize: '14px',
            }}
          >
            💡 提示: 您的选择会自动保存，下次访问时会记住您的偏好。 您也可以随时通过URL参数{' '}
            <code>?version=basic</code> 或 <code>?version=enhanced</code> 切换版本。
          </p>
        </div>
      </div>
    </div>
  );
}

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VersionSelector />
  </React.StrictMode>
);

// 性能日志
const loadTime = performance.now() - startTime;
console.log(`🚀 应用加载完成，耗时 ${loadTime.toFixed(2)}ms`);
console.log('📊 大数据表格渲染引擎 - 支持基础版和增强版');

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

// 添加未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});
