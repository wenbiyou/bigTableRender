// Web Worker 处理大数据：生成、排序、切片
// 所有大数据操作都在Worker中执行，避免阻塞主线程

// 常量定义
const TOTAL_ROWS = 100000;
const COLUMN_NAMES = ['ID', 'Col1', 'Col2', 'Col3', 'Col4', 'Col5', 'Col6', 'Col7', 'Col8', 'Col9'];
const COLUMN_KEYS = ['id', 'Col1', 'Col2', 'Col3', 'Col4', 'Col5', 'Col6', 'Col7', 'Col8', 'Col9'];

// 全局数据存储
let allData = null;
let sortedData = null;
let currentSort = { column: null, direction: null }; // null | 'asc' | 'desc'
// const currentFilter = null; // { column: null, operator: null, value: null } - 暂时未使用
// const filteredData = null; // 暂时未使用

/**
 * 生成10万行数据
 * 每行包含ID和9个随机数值列，使用对象数组格式
 */
function generateData() {
  console.log('Worker: 开始生成数据...');
  const startTime = performance.now();

  const data = new Array(TOTAL_ROWS);

  for (let i = 0; i < TOTAL_ROWS; i++) {
    const row = {
      id: i + 1,
      Col1: Math.floor(Math.random() * 10000),
      Col2: Math.floor(Math.random() * 10000),
      Col3: Math.floor(Math.random() * 10000),
      Col4: Math.floor(Math.random() * 10000),
      Col5: Math.floor(Math.random() * 10000),
      Col6: Math.floor(Math.random() * 10000),
      Col7: Math.floor(Math.random() * 10000),
      Col8: Math.floor(Math.random() * 10000),
      Col9: Math.floor(Math.random() * 10000),
    };

    data[i] = row;
  }

  const endTime = performance.now();
  console.log(`Worker: 数据生成完成，耗时 ${(endTime - startTime).toFixed(2)}ms`);

  return data;
}

/**
 * 对指定列进行排序
 */
function sortData(columnIndex, direction) {
  const columnKey = COLUMN_KEYS[columnIndex];

  const dataToSort = allData.slice();

  dataToSort.sort((a, b) => {
    const valA = a[columnKey];
    const valB = b[columnKey];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA);
    const strB = String(valB);
    return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });

  return dataToSort;
}

/**
 * 获取数据切片（虚拟滚动用）
 */
function getDataSlice(startIndex, count) {
  const dataSource = currentSort.column !== null ? sortedData : allData;

  const safeStart = Math.max(0, Math.min(startIndex, TOTAL_ROWS - 1));
  const safeEnd = Math.min(safeStart + count, TOTAL_ROWS);
  const slice = dataSource.slice(safeStart, safeEnd);

  return {
    data: slice,
    startIndex: safeStart,
    columnNames: COLUMN_NAMES,
    columnKeys: COLUMN_KEYS,
  };
}

/**
 * 重置排序状态
 */
function resetSort() {
  currentSort = { column: null, direction: null };
  sortedData = null;
  return { success: true };
}

/**
 * 获取当前状态
 */
function getStatus() {
  return {
    totalRows: TOTAL_ROWS,
    columnNames: COLUMN_NAMES,
    columnKeys: COLUMN_KEYS,
  };
}

// 初始化数据
allData = generateData();

// ==============================
// 🔥 修复点：消息返回类型严格匹配前端
// ==============================
self.addEventListener('message', function (e) {
  const { type, payload, requestId } = e.data;

  try {
    let result;
    let returnType = type;

    switch (type) {
      case 'GET_SLICE':
        console.log('GET_SLICE');
        result = getDataSlice(payload.startIndex, payload.count);
        returnType = 'SLICE'; // ✅ 固定返回
        break;

      case 'SORT':
        const { columnIndex, direction } = payload;
        sortedData = sortData(columnIndex, direction);
        currentSort = { column: columnIndex, direction };
        result = { success: true };
        returnType = 'SORTED'; // ✅ 固定返回
        break;

      case 'RESET_SORT':
        result = resetSort();
        returnType = 'RESET_SORTED'; // ✅ 固定返回
        break;

      case 'GET_STATUS':
        result = getStatus();
        returnType = 'STATUS'; // ✅ 固定返回
        break;

      default:
        result = { error: `未知操作类型: ${type}` };
    }

    // 返回
    self.postMessage({
      type: returnType,
      payload: result,
      requestId,
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error.message },
      requestId,
    });
  }
});

self.postMessage({ type: 'READY', payload: { message: 'Worker 已就绪' } });
