import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Alert, Spin, Button, Space } from 'antd';
import { DatabaseOutlined, RocketOutlined, SyncOutlined } from '@ant-design/icons';
import BigDataTable from './components/BigDataTable.jsx';
import { initGitHubPagesRouter } from './utils/gh-pages-router';

const { Title, Paragraph, Text } = Typography;

/**
 * 应用主组件
 * 负责初始化Web Worker和管理应用状态
 */
function App() {
  const [worker, setWorker] = useState(null);
  const [workerStatus, setWorkerStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [performanceInfo, setPerformanceInfo] = useState(null);
  
  const workerRef = useRef(null);
  const initTimeRef = useRef(null);

  /**
   * 初始化Web Worker
   */
  const initWorker = () => {
    try {
      setWorkerStatus('initializing');
      setError(null);
      initTimeRef.current = performance.now();
      
      // 创建Web Worker（使用Vite推荐的URL方式）
      const newWorker = new Worker(new URL('./workers/dataWorker.js', import.meta.url), {
        type: 'module'
      });
      
      workerRef.current = newWorker;
      
      // Worker消息处理
      const handleWorkerMessage = (e) => {
        switch (e.data.type) {
          case 'READY':
            const initTime = performance.now() - initTimeRef.current;
            setPerformanceInfo({
              initTime: initTime.toFixed(2),
              dataSize: '10万行 × 10列 (100万单元格)'
            });
            setWorkerStatus('ready');
            setWorker(newWorker);
            console.log(`Worker初始化完成，耗时 ${initTime.toFixed(2)}ms`);
            break;
            
          case 'ERROR':
            setError(`Worker错误: ${e.data.payload.error}`);
            setWorkerStatus('error');
            break;
        }
      };
      
      // Worker错误处理
      const handleWorkerError = (err) => {
        console.error('Worker错误:', err);
        setError(`Worker初始化失败: ${err.message}`);
        setWorkerStatus('error');
      };
      
      newWorker.addEventListener('message', handleWorkerMessage);
      newWorker.addEventListener('error', handleWorkerError);
      
      // 清理函数
      return () => {
        newWorker.removeEventListener('message', handleWorkerMessage);
        newWorker.removeEventListener('error', handleWorkerError);
        newWorker.terminate();
      };
      
    } catch (err) {
      console.error('创建Worker失败:', err);
      setError(`创建Worker失败: ${err.message}`);
      setWorkerStatus('error');
    }
  };

  /**
   * 重启Worker
   */
  const restartWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setWorker(null);
    initWorker();
  };

  // 初始化GitHub Pages路由和Worker
  useEffect(() => {
    // 初始化GitHub Pages路由适配
    initGitHubPagesRouter();
    
    const cleanup = initWorker();
    return cleanup;
  }, []);

  // 渲染内容
  const renderContent = () => {
    switch (workerStatus) {
      case 'initializing':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 20 }}>
              正在初始化大数据表格...
            </Title>
            <Paragraph type="secondary">
              正在生成10万行数据并启动Web Worker
            </Paragraph>
          </div>
        );
        
      case 'error':
        return (
          <div style={{ padding: '20px' }}>
            <Alert
              message="初始化失败"
              description={error || '未知错误'}
              type="error"
              showIcon
              action={
                <Space>
                  <Button onClick={restartWorker}>重试</Button>
                  <Button type="primary" onClick={() => window.location.reload()}>
                    刷新页面
                  </Button>
                </Space>
              }
            />
          </div>
        );
        
      case 'ready':
        return <BigDataTable worker={worker} />;
        
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 标题和描述 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Title level={2}>
              <DatabaseOutlined style={{ marginRight: 8 }} />
              超大数据表格演示
            </Title>
            <Paragraph>
              使用 <Text code>React 18</Text> + <Text code>Ant Design</Text> + <Text code>Web Worker</Text> + <Text code>虚拟滚动</Text> 实现
            </Paragraph>
            <Paragraph type="secondary">
              演示10万行 × 10列（100万单元格）数据的流畅滚动和快速排序，所有大数据操作都在Web Worker中执行，确保主线程不阻塞。
            </Paragraph>
          </div>
          
          {performanceInfo && (
            <Card size="small" style={{ minWidth: 280 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                <RocketOutlined style={{ marginRight: 8 }} />
                性能信息
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">数据规模:</Text>
                  <Text strong>{performanceInfo.dataSize}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">初始化耗时:</Text>
                  <Text strong>{performanceInfo.initTime}ms</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">当前状态:</Text>
                  <Text type="success" strong>就绪</Text>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        {/* 功能特性 */}
        <div style={{ marginTop: 24 }}>
          <Title level={5}>核心特性</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 12 }}>
            <Card key="feature-1" size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <Text strong>Web Worker数据处理</Text>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                所有数据生成、排序、切片都在Worker线程执行，主线程零阻塞
              </Paragraph>
            </Card>
            
            <Card key="feature-2" size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <Text strong>虚拟滚动</Text>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                仅渲染可视区域（30-50行），绝不渲染10万行DOM元素
              </Paragraph>
            </Card>
            
            <Card key="feature-3" size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <Text strong>快速排序</Text>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                点击列标题排序，排序过程在Worker中异步执行
              </Paragraph>
            </Card>
            
            <Card key="feature-4" size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <Text strong>实时状态</Text>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                显示总行数、可视范围、排序状态等实时信息
              </Paragraph>
            </Card>
          </div>
        </div>
      </Card>
      
      {/* 操作按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button 
          onClick={restartWorker}
          icon={<SyncOutlined />}
          disabled={workerStatus === 'initializing'}
        >
          重启Worker
        </Button>
        
        <Button 
          type="primary"
          onClick={() => {
            if (workerRef.current) {
              workerRef.current.postMessage({ type: 'GET_STATUS', requestId: Date.now() });
            }
          }}
        >
          检查状态
        </Button>
      </div>
      
      {/* 主内容 */}
      {renderContent()}
      
      {/* 使用说明 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={5}>使用说明</Title>
        <ol style={{ marginTop: 12, paddingLeft: 20 }}>
          <li key="instruction-1"><Text strong>滚动表格</Text>: 使用鼠标滚轮或拖动滚动条，体验10万行数据的流畅滚动</li>
          <li key="instruction-2"><Text strong>排序数据</Text>: 点击任意列标题进行升序/降序排序，排序过程在Worker中异步执行</li>
          <li key="instruction-3"><Text strong>重置排序</Text>: 点击排序状态旁边的重置按钮恢复原始顺序</li>
          <li key="instruction-4"><Text strong>查看状态</Text>: 顶部状态栏显示总行数、可视范围和当前排序状态</li>
        </ol>
        
        <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          <Text type="success">
            💡 提示: 打开浏览器开发者工具，查看Console中的Worker日志，了解数据生成和排序的性能表现
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default App;