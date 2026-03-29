import React, { useState, useEffect, useRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { Button, Spin, Alert, Tooltip } from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const BigDataTable = ({ worker }) => {
  // 状态
  const [visibleData, setVisibleData] = useState([]);
  const [dataStartIndex, setDataStartIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [currentSort, setCurrentSort] = useState({
    column: null,
    direction: null,
  });
  const [status, setStatus] = useState({
    totalRows: 0,
    visibleRange: "0-0",
    columnNames: [],
    columnKeys: [],
  });
  const [error, setError] = useState(null);

  // 引用 —— 解决闭包陷阱
  const listRef = useRef(null);
  const requestIdRef = useRef(0);
  const pendingRequests = useRef(new Map());
  const isMounted = useRef(true);
  const lastLoadStartRef = useRef(-1);

  // ✅ 核心修复：用 ref 存最新数据，避免闭包
  const dataStartRef = useRef(0);
  const visibleDataRef = useRef([]);

  // 常量
  const ROW_HEIGHT = 54;
  const VISIBLE_ROWS = 30;
  const BUFFER_ROWS = 20;

  // 同步最新状态到 ref
  useEffect(() => {
    visibleDataRef.current = visibleData;
  }, [visibleData]);

  useEffect(() => {
    dataStartRef.current = dataStartIndex;
  }, [dataStartIndex]);

  // 清理
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      pendingRequests.current.forEach((handler) => {
        worker?.removeEventListener("message", handler);
      });
      pendingRequests.current.clear();
    };
  }, [worker]);

  // 发送到 Worker
  const sendToWorker = useCallback(
    (type, payload) => {
      if (!worker) return Promise.reject(new Error("Worker 未就绪"));

      return new Promise((resolve, reject) => {
        const requestId = ++requestIdRef.current;
        const handler = (e) => {
          if (e.data.requestId === requestId) {
            worker.removeEventListener("message", handler);
            pendingRequests.current.delete(requestId);

            if (e.data.type === "ERROR") {
              reject(new Error(e.data.payload.error));
            } else {
              resolve(e.data.payload);
            }
          }
        };

        worker.addEventListener("message", handler);
        pendingRequests.current.set(requestId, handler);
        worker.postMessage({ type, payload, requestId });

        setTimeout(() => {
          if (pendingRequests.current.has(requestId)) {
            worker.removeEventListener("message", handler);
            pendingRequests.current.delete(requestId);
            reject(new Error("请求超时"));
          }
        }, 8000);
      });
    },
    [worker],
  );

  // ✅ 终极修复：无闭包、无状态锁死
  const loadVisibleData = useCallback(
    async (targetStart) => {
      if (!worker || sorting || !isMounted.current) return;
      if (status.totalRows === 0) return;

      // ✅ 永远读取最新值
      const currentStart = dataStartRef.current;
      const currentDataLength = visibleDataRef.current.length;

      // 计算加载范围
      const start = Math.max(0, targetStart - BUFFER_ROWS);
      const end = Math.min(
        start + VISIBLE_ROWS + BUFFER_ROWS * 2,
        status.totalRows,
      );

      // 防重复请求
      if (lastLoadStartRef.current === start) return;
      lastLoadStartRef.current = start;

      try {
        setLoading(true);
        const res = await sendToWorker("GET_SLICE", {
          startIndex: start,
          count: end - start,
        });

        if (!isMounted.current) return;
        if (!res.data || !Array.isArray(res.data)) return;

        // ✅ 更新界面
        setVisibleData(res.data);
        setDataStartIndex(res.startIndex);

        const s = res.startIndex + 1;
        const e = res.startIndex + res.data.length;
        setStatus((prev) => ({ ...prev, visibleRange: `${s}-${e}` }));
      } catch (err) {
        console.error("加载失败", err);
      } finally {
        setLoading(false);
      }

      // ✅ 依赖最小化，永不闭包
    },
    [worker, sorting, status.totalRows, sendToWorker],
  );

  // 滚动触发
  const handleScroll = useCallback(
    ({ scrollOffset }) => {
      const currentStartRow = Math.floor(scrollOffset / ROW_HEIGHT);
      loadVisibleData(currentStartRow);
    },
    [loadVisibleData],
  );

  // 排序
  const handleSort = useCallback(
    async (colIdx) => {
      if (!worker || sorting) return;
      try {
        setSorting(true);
        const dir =
          currentSort.column === colIdx && currentSort.direction === "asc"
            ? "desc"
            : "asc";
        await sendToWorker("SORT", { columnIndex: colIdx, direction: dir });
        setCurrentSort({ column: colIdx, direction: dir });

        listRef.current?.scrollTo(0);
        await loadVisibleData(0);
      } catch (err) {
        console.error("排序失败", err);
      } finally {
        setSorting(false);
      }
    },
    [worker, sorting, currentSort, sendToWorker, loadVisibleData],
  );

  // 重置排序
  const handleResetSort = useCallback(async () => {
    if (!worker || sorting) return;
    try {
      setSorting(true);
      await sendToWorker("RESET_SORT");
      setCurrentSort({ column: null, direction: null });
      listRef.current?.scrollTo(0);
      await loadVisibleData(0);
    } catch (err) {
      console.error("重置失败", err);
    } finally {
      setSorting(false);
    }
  }, [worker, sorting, sendToWorker, loadVisibleData]);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    if (!worker) return;
    try {
      const res = await sendToWorker("GET_STATUS");
      setStatus((prev) => ({
        ...prev,
        totalRows: res.totalRows,
        columnNames: res.columnNames,
        columnKeys: res.columnKeys,
      }));
    } catch (err) {
      console.error("获取状态失败", err);
    }
  }, [worker, sendToWorker]);

  // 初始化
  useEffect(() => {
    if (!worker) return;
    const init = async () => {
      await fetchStatus();
      await loadVisibleData(0);
    };
    init();
  }, [worker, fetchStatus, loadVisibleData]);

  // 行渲染 —— 纯渲染，无副作用，不报错
  const Row = useCallback(
    ({ index, style }) => {
      const localIdx = index - dataStartRef.current;
      const valid = localIdx >= 0 && localIdx < visibleDataRef.current.length;
      const row = valid ? visibleDataRef.current[localIdx] : null;
      const keys = status.columnKeys || [];

      if (row && keys.length) {
        return (
          <div className="table-row" style={style}>
            {keys.map((k, i) => (
              <div
                key={i}
                className="table-cell"
                style={{
                  width: i === 0 ? "80px" : "120px",
                  flexShrink: 0,
                  padding: "0 12px",
                  lineHeight: "54px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row[k]}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="table-row" style={style}>
          <div
            className="table-cell"
            style={{ width: "100%", textAlign: "center", color: "#aaa" }}
          >
            加载中…
          </div>
        </div>
      );
    },
    [status.columnKeys],
  );

  // 表头
  const renderHeader = useCallback(() => {
    const names = status.columnNames || [];
    return (
      <div
        className="table-header"
        style={{
          display: "flex",
          height: ROW_HEIGHT,
          background: "#fafafa",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        {names.map((name, i) => (
          <div
            key={i}
            className="table-cell"
            onClick={() => handleSort(i)}
            style={{
              width: i === 0 ? "80px" : "120px",
              flexShrink: 0,
              padding: "0 12px",
              lineHeight: "54px",
              fontWeight: 500,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span>{name}</span>
              {currentSort.column === i &&
                (currentSort.direction === "asc" ? (
                  <SortAscendingOutlined style={{ color: "#1890ff" }} />
                ) : (
                  <SortDescendingOutlined style={{ color: "#1890ff" }} />
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }, [status.columnNames, currentSort, handleSort]);

  if (error) {
    return <Alert message="出错了" description={error} type="error" />;
  }

  return (
    <div
      className="table-container"
      style={{ width: "100%", position: "relative" }}
    >
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>总行：{status.totalRows.toLocaleString()}</div>
        <div>可视：{status.visibleRange}</div>
        <div>
          排序：
          {currentSort.column
            ? `${status.columnNames[currentSort.column]} ${currentSort.direction === "asc" ? "↑" : "↓"}`
            : "未排序"}
          {currentSort.column && (
            <Tooltip title="重置排序">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleResetSort}
                style={{ marginLeft: 8 }}
                disabled={sorting}
              />
            </Tooltip>
          )}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        {(loading || sorting) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.7)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin tip={sorting ? "排序中..." : "加载中..."} />
          </div>
        )}

        {renderHeader()}

        <List
          ref={listRef}
          height={600}
          itemCount={status.totalRows || 0}
          itemSize={ROW_HEIGHT}
          width="100%"
          onScroll={handleScroll}
          overscanCount={BUFFER_ROWS}
        >
          {Row}
        </List>
      </div>
    </div>
  );
};

export default BigDataTable;
