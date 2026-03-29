import React, { useState, useEffect, useRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { 
  Button, 
  Spin, 
  Alert, 
  Tooltip, 
  Input, 
  Select, 
  Modal, 
  Space, 
  Tag,
  Dropdown,
  Menu,
  notification,
  Card,
  Row,
  Col
} from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  DownloadOutlined,
  ClearOutlined,
  PlusOutlined,
  SettingOutlined,
  CheckOutlined
} from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const EnhancedBigDataTable = ({ worker }) => {
  // 状态
  const [visibleData, setVisibleData] = useState([]);
  const [dataStartIndex, setDataStartIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [currentSort, setCurrentSort] = useState({
    column: null,
    direction: null,
  });
  const [multiSortColumns, setMultiSortColumns] = useState([]);
  const [currentFilter, setCurrentFilter] = useState(null);
  const [status, setStatus] = useState({
    totalRows: 0,
    visibleRange: "0-0",
    columnNames: [],
    columnKeys: [],
    hasFilter: false,
    hasSort: false,
    multiSortCount: 0
  });
  const [error, setError] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [multiSortModalVisible, setMultiSortModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportRows, setExportRows] = useState('all'); // 'all', 'visible', 'selected'
  const [exportContent, setExportContent] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  // 筛选状态
  const [filterColumn, setFilterColumn] = useState(null);
  const [filterOperator, setFilterOperator] = useState('equals');
  const [filterValue, setFilterValue] = useState('');
  
  // 多列排序状态
  const [sortSteps, setSortSteps] = useState([
    { columnIndex: null, direction: 'asc' }
  ]);

  // 引用 —— 解决闭包陷阱
  const listRef = useRef(null);
  const requestIdRef = useRef(0);
  const pendingRequests = useRef(new Map());
  const isMounted = useRef(true);
  const lastLoadStartRef = useRef(-1);
  const lastScrollTimeRef = useRef(0);
  const scrollDirectionRef = useRef('none'); // 'up', 'down', 'none'
  const lastScrollOffsetRef = useRef(0);

  // ✅ 核心修复：用 ref 存最新数据，避免闭包
  const dataStartRef = useRef(0);
  const visibleDataRef = useRef([]);

  // 常量
  const ROW_HEIGHT = 54;
  const VISIBLE_ROWS = 30;
  const BUFFER_ROWS = 20;

  // 筛选操作符选项
  const filterOperators = [
    { value: 'equals', label: '等于' },
    { value: 'not_equals', label: '不等于' },
    { value: 'greater_than', label: '大于' },
    { value: 'less_than', label: '小于' },
    { value: 'contains', label: '包含' },
    { value: 'starts_with', label: '开头为' },
    { value: 'ends_with', label: '结尾为' }
  ];

  // 同步最新状态到 ref
  useEffect(() => {
    visibleDataRef.current = visibleData;
  }, [visibleData]);

  useEffect(() => {
    dataStartRef.current = dataStartIndex;
  }, [dataStartIndex]);

  // 组件挂载/卸载
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // 清理所有待处理请求
      pendingRequests.current.clear();
    };
  }, []);

  // 初始化 Worker 监听
  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (e) => {
      const { type, payload, requestId } = e.data;

      // 清理已完成的请求
      if (requestId && pendingRequests.current.has(requestId)) {
        pendingRequests.current.delete(requestId);
      }

      switch (type) {
        case "SLICE":
          if (isMounted.current) {
            setVisibleData(payload.data);
            setDataStartIndex(payload.startIndex);
            setLoading(false);
            
            setStatus(prev => ({
              ...prev,
              totalRows: payload.totalRows || 0,
              visibleRange: `${payload.startIndex}-${payload.startIndex + payload.data.length}`,
              columnNames: payload.columnNames || [],
              columnKeys: payload.columnKeys || [],
              hasFilter: payload.hasFilter || false,
              hasSort: payload.hasSort || false,
              multiSortCount: payload.multiSortCount || 0
            }));
          }
          break;

        case "SORTED":
          if (isMounted.current) {
            setSorting(false);
            setCurrentSort(payload.sort || { column: null, direction: null });
            setMultiSortColumns([{ 
              columnIndex: payload.sort?.column, 
              direction: payload.sort?.direction 
            }]);
            // 重新加载当前可视区域数据
            loadVisibleData(dataStartRef.current);
          }
          break;

        case "MULTI_SORTED":
          if (isMounted.current) {
            setSorting(false);
            setMultiSortColumns(payload.columns || []);
            if (payload.columns.length > 0) {
              setCurrentSort({
                column: payload.columns[0].columnIndex,
                direction: payload.columns[0].direction
              });
            } else {
              setCurrentSort({ column: null, direction: null });
            }
            loadVisibleData(dataStartRef.current);
          }
          break;

        case "FILTER_APPLIED":
          if (isMounted.current) {
            setCurrentFilter(payload.filter || null);
            loadVisibleData(0); // 筛选后从第一行开始
          }
          break;

        case "FILTER_CLEARED":
          if (isMounted.current) {
            setCurrentFilter(null);
            loadVisibleData(dataStartRef.current);
          }
          break;

        case "EXPORT_CSV_RESULT":
        case "EXPORT_JSON_RESULT":
          if (isMounted.current) {
            setExportContent(payload);
            notification.success({
              message: '导出成功',
              description: `已生成${type === 'EXPORT_CSV_RESULT' ? 'CSV' : 'JSON'}格式数据`,
            });
          }
          break;

        case "STATUS":
          if (isMounted.current) {
            setStatus(prev => ({
              ...prev,
              totalRows: payload.totalRows || 0,
              columnNames: payload.columnNames || [],
              columnKeys: payload.columnKeys || [],
              hasFilter: payload.hasFilter || false,
              hasSort: payload.hasSort || false,
              multiSortCount: payload.multiSortCount || 0
            }));
          }
          break;

        case "ERROR":
          if (isMounted.current) {
            setError(payload.error);
            setLoading(false);
            setSorting(false);
          }
          break;
      }
    };

    worker.addEventListener("message", handleWorkerMessage);

    return () => {
      worker.removeEventListener("message", handleWorkerMessage);
    };
  }, [worker]);

  // ✅ 核心函数：加载可视区域数据
  const loadVisibleData = useCallback(
    async (startIndex) => {
      if (!worker || !isMounted.current) return;

      // 调试日志
      console.log(`📊 loadVisibleData 调用: startIndex=${startIndex}, scrollDirection=${scrollDirectionRef.current}`);
      
      // 边界检查
      const safeStart = Math.max(0, startIndex);
      const totalRows = status.totalRows || 100000;
      if (safeStart >= totalRows) return;

      // 检查是否已有相同请求在处理中
      const requestKey = `load-${safeStart}`;
      if (pendingRequests.current.has(requestKey)) {
        console.log(`🔄 已有相同请求在处理中: ${requestKey}`);
        return;
      }

      // 获取当前缓存的数据范围
      const currentStart = dataStartRef.current;
      const currentData = visibleDataRef.current;
      const currentEnd = currentStart + currentData.length;
      const currentLength = currentData.length;

      // 请求的数据范围
      const requestLength = VISIBLE_ROWS + BUFFER_ROWS * 2;
      const requestEnd = safeStart + requestLength;

      // 计算重叠区域
      const overlapStart = Math.max(currentStart, safeStart);
      const overlapEnd = Math.min(currentEnd, requestEnd);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);

      // 判断滚动方向 - 主要基于实际滚动方向，位置作为辅助
      const isScrollingUp = scrollDirectionRef.current === 'up';
      const isScrollingDown = scrollDirectionRef.current === 'down';
      
      // 如果没有滚动方向信息（初始状态），使用位置判断
      const positionBasedUp = safeStart < currentStart;
      const positionBasedDown = safeStart > currentStart;
      const finalIsScrollingUp = isScrollingUp || (scrollDirectionRef.current === 'none' && positionBasedUp);
      const finalIsScrollingDown = isScrollingDown || (scrollDirectionRef.current === 'none' && positionBasedDown);
      
      // 检查是否需要加载新数据
      let shouldSkip = false;
      let skipReason = '';

      // 情况1: 完全在缓存范围内（不需要加载）
      if (safeStart >= currentStart && requestEnd <= currentEnd) {
        shouldSkip = true;
        skipReason = '完全在缓存范围内';
      }
      // 情况2: 向下滚动且重叠度足够高
      else if (finalIsScrollingDown && overlapLength >= requestLength * 0.7) {
        shouldSkip = true;
        skipReason = `向下滚动重叠度 ${((overlapLength / requestLength) * 100).toFixed(1)}%`;
      }
      // 情况3: 向上滚动 - 绝对策略：永远加载
      else if (finalIsScrollingUp) {
        // 向上滚动时，为了100%数据完整性，我们永远加载数据
        shouldSkip = false;
        const newDataNeeded = Math.max(0, currentStart - safeStart);
        skipReason = `向上滚动需要加载 ${newDataNeeded} 行新数据`;
        console.log(`🚨 向上滚动检测: ${skipReason}, 强制加载`);
      }
      // 情况4: 没有明确方向，但重叠度足够高
      else if (overlapLength >= requestLength * 0.9) {
        shouldSkip = true;
        skipReason = `高重叠度 ${((overlapLength / requestLength) * 100).toFixed(1)}%`;
      }
      // 情况5: 相同位置（防抖）
      else if (safeStart === lastLoadStartRef.current) {
        shouldSkip = true;
        skipReason = '相同位置';
      }

      // 🚨 关键修复：如果是向上滚动，永远不跳过！
      if (finalIsScrollingUp) {
        console.log(`🚨 向上滚动检测，强制加载数据（跳过检查被覆盖）`);
        shouldSkip = false;
        skipReason = `向上滚动强制加载`;
      }
      
      if (shouldSkip && safeStart !== 0) {
        console.log(`跳过加载: ${skipReason}`);
        
        // 即使跳过加载，也需要更新数据起始索引
        if (safeStart !== dataStartRef.current) {
          // 计算需要从缓存中提取的数据
          const cacheStart = Math.max(currentStart, safeStart);
          const cacheEnd = Math.min(currentEnd, safeStart + VISIBLE_ROWS);
          const cacheLength = cacheEnd - cacheStart;
          
          if (cacheLength > 0) {
            // 从缓存中提取数据
            const cacheIndex = cacheStart - currentStart;
            const newVisibleData = currentData.slice(cacheIndex, cacheIndex + cacheLength);
            
            // 更新状态
            setVisibleData(newVisibleData);
            setDataStartIndex(cacheStart);
            setStatus(prev => ({
              ...prev,
              visibleRange: `${cacheStart}-${cacheEnd}`
            }));
          }
        }
        
        if (shouldSkip) {
          return;
        }
      }

      // 设置加载状态
      setLoading(true);
      lastLoadStartRef.current = safeStart;

      // 生成唯一请求ID
      const requestId = `load-${Date.now()}-${requestIdRef.current++}`;
      pendingRequests.current.set(requestKey, requestId);

      // 发送请求到Worker
      worker.postMessage({
        type: "GET_SLICE",
        payload: {
          startIndex: safeStart,
          count: requestLength,
        },
        requestId,
      });
    },
    [worker, status.totalRows],
  );

  // 处理滚动 - 添加防抖、方向感知和智能加载
  const handleScroll = useCallback(
    ({ scrollOffset }) => {
      const startIndex = Math.floor(scrollOffset / ROW_HEIGHT);
      
      // 计算滚动方向
      if (scrollOffset !== lastScrollOffsetRef.current) {
        const newDirection = scrollOffset > lastScrollOffsetRef.current ? 'down' : 'up';
        if (newDirection !== scrollDirectionRef.current) {
          console.log(`🔄 滚动方向变化: ${scrollDirectionRef.current} -> ${newDirection}`);
          scrollDirectionRef.current = newDirection;
        }
        lastScrollOffsetRef.current = scrollOffset;
      }
      
      // 智能防抖：根据滚动方向调整频率
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;
      
      // 向下滚动可以更频繁（用户快速浏览）
      // 向上滚动需要更谨慎（用户可能在看特定内容）
      const debounceTime = scrollDirectionRef.current === 'down' ? 30 : 50;
      
      if (timeSinceLastScroll < debounceTime) {
        return;
      }
      lastScrollTimeRef.current = now;
      
      loadVisibleData(startIndex);
    },
    [loadVisibleData],
  );

  // 单列排序
  const handleSort = useCallback(
    (columnIndex) => {
      if (!worker || sorting) return;

      const newDirection =
        currentSort.column === columnIndex && currentSort.direction === "asc"
          ? "desc"
          : "asc";

      setSorting(true);
      setCurrentSort({ column: columnIndex, direction: newDirection });

      worker.postMessage({
        type: "SORT",
        payload: { columnIndex, direction: newDirection },
        requestId: `sort-${Date.now()}`,
      });
    },
    [worker, sorting, currentSort],
  );

  // 应用多列排序
  const applyMultiSort = useCallback(() => {
    if (!worker || sorting) return;

    const validSteps = sortSteps.filter(step => step.columnIndex !== null);
    if (validSteps.length === 0) {
      notification.warning({
        message: '排序配置为空',
        description: '请至少选择一个排序列',
      });
      return;
    }

    setSorting(true);
    setMultiSortColumns(validSteps);

    worker.postMessage({
      type: "MULTI_SORT",
      payload: { columns: validSteps },
      requestId: `multi-sort-${Date.now()}`,
    });

    setMultiSortModalVisible(false);
  }, [worker, sorting, sortSteps]);

  // 应用筛选
  const applyFilter = useCallback(() => {
    if (!worker || !filterColumn || filterValue === '') {
      notification.warning({
        message: '筛选条件不完整',
        description: '请选择列、操作符并输入筛选值',
      });
      return;
    }

    worker.postMessage({
      type: "APPLY_FILTER",
      payload: {
        filter: {
          columnIndex: filterColumn,
          operator: filterOperator,
          value: filterValue
        }
      },
      requestId: `filter-${Date.now()}`,
    });

    setFilterModalVisible(false);
  }, [worker, filterColumn, filterOperator, filterValue]);

  // 清除筛选
  const clearFilter = useCallback(() => {
    if (!worker) return;

    worker.postMessage({
      type: "CLEAR_FILTER",
      requestId: `clear-filter-${Date.now()}`,
    });

    setFilterColumn(null);
    setFilterOperator('equals');
    setFilterValue('');
  }, [worker]);

  // 重置排序
  const resetSort = useCallback(() => {
    if (!worker) return;

    worker.postMessage({
      type: "RESET_SORT",
      requestId: `reset-${Date.now()}`,
    });

    setCurrentSort({ column: null, direction: null });
    setMultiSortColumns([]);
    setSortSteps([{ columnIndex: null, direction: 'asc' }]);
  }, [worker]);

  // 导出数据
  const handleExport = useCallback(() => {
    if (!worker) return;

    let rowsToExport = null;
    if (exportRows === 'visible') {
      rowsToExport = Array.from(
        { length: visibleData.length },
        (_, i) => dataStartIndex + i
      );
    } else if (exportRows === 'selected' && selectedRows.size > 0) {
      rowsToExport = Array.from(selectedRows);
    }

    const exportType = exportFormat === 'csv' ? 'EXPORT_CSV' : 'EXPORT_JSON';
    
    worker.postMessage({
      type: exportType,
      payload: { rows: rowsToExport },
      requestId: `export-${Date.now()}`,
    });
  }, [worker, exportFormat, exportRows, visibleData.length, dataStartIndex, selectedRows]);

  // 下载导出文件
  const downloadExport = useCallback(() => {
    if (!exportContent) return;

    const blob = new Blob([exportContent], {
      type: exportFormat === 'csv' ? 'text/csv' : 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bigtable-export-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportContent, exportFormat]);

  // 添加排序步骤
  const addSortStep = useCallback(() => {
    setSortSteps(prev => [...prev, { columnIndex: null, direction: 'asc' }]);
  }, []);

  // 更新排序步骤
  const updateSortStep = useCallback((index, field, value) => {
    setSortSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return newSteps;
    });
  }, []);

  // 删除排序步骤
  const removeSortStep = useCallback((index) => {
    setSortSteps(prev => {
      const newSteps = prev.filter((_, i) => i !== index);
      return newSteps.length > 0 ? newSteps : [{ columnIndex: null, direction: 'asc' }];
    });
  }, []);

  // 渲染表格行
  const RowComponent = useCallback(
    ({ index, style }) => {
      const localIndex = index - dataStartIndex;
      const rowData = visibleData[localIndex];
      const isSelected = selectedRows.has(index);

      if (!rowData) {
        return (
          <div
            style={{
              ...style,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <Spin size="small" />
            <span style={{ marginLeft: 8, color: "#999" }}>加载中...</span>
          </div>
        );
      }

      return (
        <div
          style={{
            ...style,
            display: "flex",
            borderBottom: "1px solid #f0f0f0",
            background: isSelected ? '#e6f7ff' : (index % 2 === 0 ? "#fff" : "#fafafa"),
            cursor: 'pointer',
            padding: '0 16px',
            alignItems: 'center'
          }}
          onClick={() => {
            const newSelected = new Set(selectedRows);
            if (newSelected.has(index)) {
              newSelected.delete(index);
            } else {
              newSelected.add(index);
            }
            setSelectedRows(newSelected);
          }}
        >
          <div style={{ width: 40, textAlign: 'center', color: '#999' }}>
            {isSelected ? <CheckOutlined style={{ color: '#1890ff' }} /> : index + 1}
          </div>
          {status.columnKeys.map((key, colIndex) => (
            <div
              key={colIndex}
              style={{
                flex: 1,
                padding: "12px 8px",
                minWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {rowData[key]}
            </div>
          ))}
        </div>
      );
    },
    [dataStartIndex, visibleData, status.columnKeys, selectedRows],
  );

  // 渲染表头
  const renderTableHeader = useCallback(() => {
    if (!status.columnNames.length) return null;

    return (
      <div
        style={{
          display: "flex",
          background: "#fafafa",
          borderBottom: "2px solid #1890ff",
          fontWeight: "bold",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ width: 40, textAlign: 'center', color: '#999' }}>#</div>
        {status.columnNames.map((name, index) => {
          const isSorted = currentSort.column === index;
          const isMultiSorted = multiSortColumns.some(col => col.columnIndex === index);
          const multiSortIndex = multiSortColumns.findIndex(col => col.columnIndex === index);
          
          return (
            <div
              key={index}
              style={{
                flex: 1,
                padding: "12px 8px",
                minWidth: 120,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: isSorted ? "#e6f7ff" : (isMultiSorted ? "#f6ffed" : "transparent"),
                border: isSorted ? "1px solid #91d5ff" : (isMultiSorted ? "1px solid #b7eb8f" : "none"),
                borderRadius: 4,
              }}
              onClick={() => handleSort(index)}
            >
              <span>{name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {isMultiSorted && (
                  <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                    {multiSortIndex + 1}
                  </Tag>
                )}
                {isSorted && (
                  currentSort.direction === "asc" ? (
                    <SortAscendingOutlined style={{ color: "#1890ff" }} />
                  ) : (
                    <SortDescendingOutlined style={{ color: "#1890ff" }} />
                  )
                )}
                {!isSorted && !isMultiSorted && (
                  <SortAscendingOutlined style={{ color: "#d9d9d9" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [status.columnNames, currentSort, multiSortColumns, handleSort]);

  // 渲染控制面板
  const renderControlPanel = useCallback(() => {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => setFilterModalVisible(true)}
                disabled={!worker}
              >
                数据筛选
                {currentFilter && <Tag color="blue" style={{ marginLeft: 4 }}>已启用</Tag>}
              </Button>
              
              <Button
                icon={<SettingOutlined />}
                onClick={() => setMultiSortModalVisible(true)}
                disabled={!worker}
              >
                多列排序
                {multiSortColumns.length > 0 && (
                  <Tag color="green" style={{ marginLeft: 4 }}>
                    {multiSortColumns.length}列
                  </Tag>
                )}
              </Button>
              
              <Button
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
                disabled={!worker}
              >
                数据导出
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={resetSort}
                disabled={!worker || (!currentSort.column && multiSortColumns.length === 0)}
              >
                重置排序
              </Button>
              
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilter}
                disabled={!worker || !currentFilter}
              >
                清除筛选
              </Button>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Tag color="blue">
                总行数: {status.totalRows.toLocaleString()}
              </Tag>
              <Tag color={status.hasFilter ? "green" : "default"}>
                筛选: {status.hasFilter ? "启用" : "关闭"}
              </Tag>
              <Tag color={status.hasSort ? "orange" : "default"}>
                排序: {status.hasSort ? "启用" : "关闭"}
              </Tag>
              <Tag color={multiSortColumns.length > 1 ? "purple" : "default"}>
                多列排序: {multiSortColumns.length}列
              </Tag>
              <Tag color={selectedRows.size > 0 ? "red" : "default"}>
                已选: {selectedRows.size}行
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }, [worker, currentFilter, multiSortColumns, status, selectedRows, resetSort, clearFilter]);

  // 渲染筛选模态框
  const renderFilterModal = useCallback(() => {
    return (
      <Modal
        title="数据筛选"
        open={filterModalVisible}
        onOk={applyFilter}
        onCancel={() => setFilterModalVisible(false)}
        okText="应用筛选"
        cancelText="取消"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>选择列</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择要筛选的列"
              value={filterColumn}
              onChange={setFilterColumn}
            >
              {status.columnNames.map((name, index) => (
                <Option key={index} value={index}>{name}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>选择操作符</div>
            <Select
              style={{ width: '100%' }}
              value={filterOperator}
              onChange={setFilterOperator}
            >
              {filterOperators.map(op => (
                <Option key={op.value} value={op.value}>{op.label}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>筛选值</div>
            <Input
              placeholder="输入筛选值"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              onPressEnter={applyFilter}
            />
          </div>
          
          {currentFilter && (
            <Alert
              message="当前筛选条件"
              description={`${status.columnNames[currentFilter.columnIndex]} ${filterOperators.find(op => op.value === currentFilter.operator)?.label} ${currentFilter.value}`}
              type="info"
              showIcon
            />
          )}
        </Space>
      </Modal>
    );
  }, [filterModalVisible, filterColumn, filterOperator, filterValue, status.columnNames, currentFilter, applyFilter]);

  // 渲染多列排序模态框
  const renderMultiSortModal = useCallback(() => {
    return (
      <Modal
        title="多列排序配置"
        open={multiSortModalVisible}
        onOk={applyMultiSort}
        onCancel={() => setMultiSortModalVisible(false)}
        okText="应用排序"
        cancelText="取消"
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="排序优先级说明"
            description="排序将按照配置的顺序执行，第一列为最高优先级"
            type="info"
            showIcon
          />
          
          {sortSteps.map((step, index) => (
            <Card key={index} size="small">
              <Row gutter={16} align="middle">
                <Col span={2}>
                  <Tag color="blue" style={{ margin: 0 }}>步骤 {index + 1}</Tag>
                </Col>
                <Col span={10}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择排序列"
                    value={step.columnIndex}
                    onChange={(value) => updateSortStep(index, 'columnIndex', value)}
                  >
                    <Option value={null}>请选择列</Option>
                    {status.columnNames.map((name, colIndex) => (
                      <Option key={colIndex} value={colIndex}>{name}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Select
                    style={{ width: '100%' }}
                    value={step.direction}
                    onChange={(value) => updateSortStep(index, 'direction', value)}
                  >
                    <Option value="asc">升序 (A-Z, 0-9)</Option>
                    <Option value="desc">降序 (Z-A, 9-0)</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  {sortSteps.length > 1 && (
                    <Button
                      danger
                      size="small"
                      onClick={() => removeSortStep(index)}
                    >
                      删除
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>
          ))}
          
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addSortStep}
            block
          >
            添加排序步骤
          </Button>
          
          {multiSortColumns.length > 0 && (
            <Alert
              message="当前排序配置"
              description={
                <div>
                  {multiSortColumns.map((col, idx) => (
                    <div key={idx}>
                      {idx + 1}. {status.columnNames[col.columnIndex]} ({col.direction === 'asc' ? '升序' : '降序'})
                    </div>
                  ))}
                </div>
              }
              type="success"
              showIcon
            />
          )}
        </Space>
      </Modal>
    );
  }, [multiSortModalVisible, sortSteps, status.columnNames, multiSortColumns, applyMultiSort, updateSortStep, removeSortStep, addSortStep]);

  // 渲染导出模态框
  const renderExportModal = useCallback(() => {
    return (
      <Modal
        title="数据导出"
        open={exportModalVisible}
        onOk={() => {
          handleExport();
          setExportModalVisible(false);
        }}
        onCancel={() => setExportModalVisible(false)}
        okText="生成导出"
        cancelText="取消"
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            取消
          </Button>,
          <Button key="export" type="primary" onClick={handleExport}>
            生成导出
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={downloadExport}
            disabled={!exportContent}
          >
            下载文件
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>导出格式</div>
              <Select
                style={{ width: '100%' }}
                value={exportFormat}
                onChange={setExportFormat}
              >
                <Option value="csv">CSV (逗号分隔值)</Option>
                <Option value="json">JSON (JavaScript对象表示法)</Option>
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>导出范围</div>
              <Select
                style={{ width: '100%' }}
                value={exportRows}
                onChange={setExportRows}
              >
                <Option value="all">全部数据 ({status.totalRows.toLocaleString()} 行)</Option>
                <Option value="visible">当前可视区域 ({visibleData.length} 行)</Option>
                <Option value="selected" disabled={selectedRows.size === 0}>
                  已选行 ({selectedRows.size} 行)
                </Option>
              </Select>
            </Col>
          </Row>
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>导出预览</div>
            <TextArea
              value={exportContent}
              readOnly
              rows={8}
              placeholder="生成导出内容后将显示在这里"
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          
          <Alert
            message="导出说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>CSV格式适合Excel等表格软件导入</li>
                <li>JSON格式适合程序处理和数据交换</li>
                <li>导出大量数据可能需要一些时间</li>
                <li>生成后点击"下载文件"按钮保存到本地</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    );
  }, [exportModalVisible, exportFormat, exportRows, status.totalRows, visibleData.length, selectedRows, exportContent, handleExport, downloadExport]);

  // 渲染错误提示
  const renderError = useCallback(() => {
    if (!error) return null;

    return (
      <Alert
        message="数据加载错误"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" onClick={() => setError(null)}>
            关闭
          </Button>
        }
      />
    );
  }, [error]);

  // 初始加载
  useEffect(() => {
    if (worker && isMounted.current) {
      loadVisibleData(0);
    }
  }, [worker, loadVisibleData]);

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {renderControlPanel()}
      {renderError()}
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 8, color: '#999' }}>加载数据中...</div>
        </div>
      )}

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        {renderTableHeader()}
        
        <List
          ref={listRef}
          height={ROW_HEIGHT * VISIBLE_ROWS}
          itemCount={status.totalRows}
          itemSize={ROW_HEIGHT}
          width="100%"
          onScroll={handleScroll}
          style={{ overflowX: 'hidden' }}
        >
          {RowComponent}
        </List>
      </div>

      {renderFilterModal()}
      {renderMultiSortModal()}
      {renderExportModal()}
    </div>
  );
};

export default EnhancedBigDataTable;