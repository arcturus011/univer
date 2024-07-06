import {
  BooleanNumber,
  DEFAULT_WORKSHEET_COLUMN_COUNT, DEFAULT_WORKSHEET_COLUMN_TITLE_HEIGHT,
  DEFAULT_WORKSHEET_COLUMN_WIDTH,
  DEFAULT_WORKSHEET_ROW_COUNT, DEFAULT_WORKSHEET_ROW_HEIGHT, DEFAULT_WORKSHEET_ROW_TITLE_WIDTH
} from "@univerjs/core";

export const worksheetExample = {
  name: 'Sheet1', // TODO: name should have i18n
  id: 'sheet-01',
  tabColor: '',
  hidden: BooleanNumber.FALSE,
  rowCount: DEFAULT_WORKSHEET_ROW_COUNT,
  columnCount: DEFAULT_WORKSHEET_COLUMN_COUNT,
  zoomRatio: 1,
  freeze: {
    xSplit: 0,
    ySplit: 0,
    startRow: -1,
    startColumn: -1,
  },
  scrollTop: 0,
  scrollLeft: 0,
  defaultColumnWidth: DEFAULT_WORKSHEET_COLUMN_WIDTH,
  defaultRowHeight: DEFAULT_WORKSHEET_ROW_HEIGHT,
  mergeData: [],
  cellData: {},
  rowData: {},
  columnData: {},
  showGridlines: BooleanNumber.TRUE,
  rowHeader: {
    width: DEFAULT_WORKSHEET_ROW_TITLE_WIDTH,
    hidden: BooleanNumber.FALSE,
  },
  columnHeader: {
    height: DEFAULT_WORKSHEET_COLUMN_TITLE_HEIGHT,
    hidden: BooleanNumber.FALSE,
  },
  selections: ['A1'],
  rightToLeft: BooleanNumber.FALSE,
}