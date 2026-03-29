// Web Worker 处理大数据：生成、排序、切片、筛选、导出
// 所有大数据操作都在Worker中执行，避免阻塞主线程

// 常量定义
const TOTAL_ROWS = 100000;
const COLUMN_NAMES = ['ID', 'Col1', 'Col2', 'Col3', 'Col4', 'Col5', 'Col6', 'Col7', 'Col8', 'Col9'];
const COLUMN_KEYS = ['id', 'Col1', 'Col2', 'Col3', 'Col4', 'Col5', 'Col6', 'Col7', 'Col8', 'Col9'];

// 支持的筛选操作符
const FILTER_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  CONTAINS: 'contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
};

// 全局数据存储
let allData = null;
let sortedData = null;
let currentSort = { column: null, direction: null }; // null | 'asc' | 'desc'
let currentFilter = null; // { column: null, operator: null, value: null }
let filteredData = null;
let multiSortColumns = []; // 多列排序配置

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
 * 获取当前有效数据（考虑排序和筛选状态）
 */
function getCurrentData() {
  let data = allData;

  // 应用筛选
  if (filteredData && currentFilter) {
    data = filteredData;
  }

  // 应用排序
  if (sortedData && currentSort.column !== null) {
    data = sortedData;
  }

  return data;
}

/**
 * 获取当前数据总行数（考虑筛选状态）
 */
function getTotalRows() {
  if (filteredData && currentFilter) {
    return filteredData.length;
  }
  return TOTAL_ROWS;
}

/**
 * 对指定列进行排序
 */
function sortData(columnIndex, direction) {
  const columnKey = COLUMN_KEYS[columnIndex];

  const dataToSort = getCurrentData().slice();

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
 * 多列排序
 * @param {Array} columns - [{ columnIndex, direction }, ...]
 */
function sortByMultiple(columns) {
  const dataToSort = getCurrentData().slice();

  dataToSort.sort((a, b) => {
    for (const { columnIndex, direction } of columns) {
      const columnKey = COLUMN_KEYS[columnIndex];
      const valA = a[columnKey];
      const valB = b[columnKey];

      let comparison = 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        const strA = String(valA);
        const strB = String(valB);
        comparison = strA.localeCompare(strB);
      }

      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  return dataToSort;
}

/**
 * 应用筛选条件
 * @param {Object} filter - { columnIndex, operator, value }
 */
function applyFilter(filter) {
  if (!filter || filter.columnIndex === null || filter.value === null) {
    currentFilter = null;
    filteredData = null;
    return allData;
  }

  const columnKey = COLUMN_KEYS[filter.columnIndex];
  const filterValue = filter.value;
  const filterValueTrimmed = String(filterValue).trim();

  // 尝试将筛选值转换为数字（针对数值列）
  const numericFilterValue = Number(filterValueTrimmed);
  const isNumericFilter = !isNaN(numericFilterValue) && filterValueTrimmed !== '';

  const filtered = allData.filter((row) => {
    const cellValue = row[columnKey];

    switch (filter.operator) {
      case FILTER_OPERATORS.EQUALS:
        // 如果是数值列且筛选值是数字，使用严格数字比较
        if (isNumericFilter && typeof cellValue === 'number') {
          return cellValue === numericFilterValue;
        }
        // 否则使用宽松比较
        return cellValue == filterValueTrimmed;
      case FILTER_OPERATORS.NOT_EQUALS:
        if (isNumericFilter && typeof cellValue === 'number') {
          return cellValue !== numericFilterValue;
        }
        return cellValue != filterValueTrimmed;
      case FILTER_OPERATORS.GREATER_THAN:
        if (isNumericFilter && typeof cellValue === 'number') {
          return cellValue > numericFilterValue;
        }
        // 非数字比较
        return String(cellValue) > filterValueTrimmed;
      case FILTER_OPERATORS.LESS_THAN:
        if (isNumericFilter && typeof cellValue === 'number') {
          return cellValue < numericFilterValue;
        }
        return String(cellValue) < filterValueTrimmed;
      case FILTER_OPERATORS.CONTAINS:
        return String(cellValue).includes(filterValueTrimmed);
      case FILTER_OPERATORS.STARTS_WITH:
        return String(cellValue).startsWith(filterValueTrimmed);
      case FILTER_OPERATORS.ENDS_WITH:
        return String(cellValue).endsWith(filterValueTrimmed);
      default:
        return true;
    }
  });

  currentFilter = filter;
  filteredData = filtered;

  // 重置排序，因为筛选后数据变了
  currentSort = { column: null, direction: null };
  sortedData = null;
  multiSortColumns = [];

  return filtered;
}

/**
 * 清除筛选
 */
function clearFilter() {
  currentFilter = null;
  filteredData = null;
  // 重置排序，因为数据已改变
  currentSort = { column: null, direction: null };
  sortedData = null;
  multiSortColumns = [];
  return allData;
}

/**
 * 获取数据切片（虚拟滚动用）
 */
function getDataSlice(startIndex, count) {
  const dataSource = getCurrentData();
  const totalRows = getTotalRows();

  const safeStart = Math.max(0, Math.min(startIndex, totalRows - 1));
  const safeEnd = Math.min(safeStart + count, totalRows);
  const slice = dataSource.slice(safeStart, safeEnd);

  return {
    data: slice,
    startIndex: safeStart,
    columnNames: COLUMN_NAMES,
    columnKeys: COLUMN_KEYS,
    totalRows,
    hasFilter: !!currentFilter,
    hasSort: currentSort.column !== null,
    multiSortCount: multiSortColumns.length,
  };
}

/**
 * 重置排序状态
 */
function resetSort() {
  currentSort = { column: null, direction: null };
  sortedData = null;
  multiSortColumns = [];
  return { success: true };
}

/**
 * 导出数据为CSV格式
 * @param {Array} rows - 要导出的行索引数组
 */
function exportToCSV(rows = null) {
  const dataSource = getCurrentData();
  const exportData = rows ? rows.map((index) => dataSource[index]) : dataSource;

  // 创建CSV头部
  const headers = COLUMN_NAMES.join(',');

  // 创建数据行
  const dataRows = exportData.map((row) =>
    COLUMN_KEYS.map((key) => {
      const value = row[key];
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers, ...dataRows].join('\n');
}

/**
 * 导出数据为JSON格式
 * @param {Array} rows - 要导出的行索引数组
 */
function exportToJSON(rows = null) {
  const dataSource = getCurrentData();
  const exportData = rows ? rows.map((index) => dataSource[index]) : dataSource;

  return JSON.stringify(
    {
      metadata: {
        totalRows: exportData.length,
        columns: COLUMN_NAMES,
        exportTime: new Date().toISOString(),
        hasFilter: !!currentFilter,
        hasSort: currentSort.column !== null,
        filter: currentFilter,
        sort: currentSort,
      },
      data: exportData,
    },
    null,
    2
  );
}

/**
 * 获取当前状态
 */
function getStatus() {
  return {
    totalRows: getTotalRows(),
    columnNames: COLUMN_NAMES,
    columnKeys: COLUMN_KEYS,
    currentSort,
    currentFilter,
    hasFilter: !!currentFilter,
    hasSort: currentSort.column !== null,
    multiSortCount: multiSortColumns.length,
    filterOperators: FILTER_OPERATORS,
  };
}

// 初始化数据
allData = generateData();

// ==============================
// 🔥 消息处理
// ==============================
self.addEventListener('message', function (e) {
  const { type, payload, requestId } = e.data;

  try {
    let result;
    let returnType = type;

    switch (type) {
      case 'GET_SLICE':
        result = getDataSlice(payload.startIndex, payload.count);
        returnType = 'SLICE';
        break;

      case 'SORT':
        const { columnIndex, direction } = payload;
        sortedData = sortData(columnIndex, direction);
        currentSort = { column: columnIndex, direction };
        multiSortColumns = [{ columnIndex, direction }];
        result = { success: true };
        returnType = 'SORTED';
        break;

      case 'MULTI_SORT':
        sortedData = sortByMultiple(payload.columns);
        currentSort =
          payload.columns.length > 0
            ? { column: payload.columns[0].columnIndex, direction: payload.columns[0].direction }
            : { column: null, direction: null };
        multiSortColumns = payload.columns;
        result = { success: true };
        returnType = 'MULTI_SORTED';
        break;

      case 'APPLY_FILTER':
        result = { filter: currentFilter, data: applyFilter(payload.filter) };
        returnType = 'FILTER_APPLIED';
        break;

      case 'CLEAR_FILTER':
        result = { filter: null, data: clearFilter() };
        returnType = 'FILTER_CLEARED';
        break;

      case 'RESET_SORT':
        result = resetSort();
        returnType = 'RESET_SORTED';
        break;

      case 'EXPORT_CSV':
        result = exportToCSV(payload.rows);
        returnType = 'EXPORT_CSV_RESULT';
        break;

      case 'EXPORT_JSON':
        result = exportToJSON(payload.rows);
        returnType = 'EXPORT_JSON_RESULT';
        break;

      case 'GET_STATUS':
        result = getStatus();
        returnType = 'STATUS';
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

self.postMessage({ type: 'READY', payload: { message: '增强版 Worker 已就绪' } });
