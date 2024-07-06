import * as Y from 'yjs'
import { YjsCellMatrix } from './cell-matrix.ts'
import {
  DEFAULT_WORKSHEET_COLUMN_COUNT,
  DEFAULT_WORKSHEET_ROW_COUNT,
  IColumnData,
  IRange,
  IRowData,
  IWorksheetData
} from "@univerjs/core";
import { deepSet } from "../utils/deep-set.ts";

const getIdStr = (id: Y.ID) => id.client + '|' + id.clock

export class YjsRowDataMap extends Y.Map<any> implements IRowData {
  get h() {
    return this.get('h')
  }
}

export class YjsColumnDataMap extends Y.Map<any> implements IColumnData {
  get w() {
    return this.get('w')
  }
}

export class YjsWorksheet extends Y.Map<any> /*implements Partial<IWorksheetData>*/ {
  static RefID = 8

  override _write(_encoder: { writeTypeRef: (arg0: number) => void; }) {
    _encoder.writeTypeRef(YjsWorksheet.RefID)
  }

  get id(): string {
    return this.get('id')
  }

  get name(): string {
    return this.get('name')
  }

  get tabColor(): string {
    return this.get('tabColor')
  }

  get rowData(): Y.Array<YjsRowDataMap> {
    return this.get('rowData')
  }

  get columnData(): Y.Array<YjsColumnDataMap> {
    return this.get('columnData')
  }

  get cellData() {
    return this.get('cellData') as YjsCellMatrix
  }

  get mergeData(): Y.Array<IRange> {
    return this.get('mergeData')
  }

  get rowCount() {
    return this.rowData.length
  }

  get columnCount() {
    return this.columnData.length
  }

  constructor() {
    super()
  }

  // private getRowOrColumnRelPos(type: YjsColumnDataMap | YjsRowDataMap) {
  //   return Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(type, 0))
  // }

  getColumnId(index: number) {
    return this.columnData.get(index).get('_id')
  }

  getColumnIndex(columnId: string) {
    return this.columnIds.indexOf(columnId)
  }

  getRowId(index: number) {
    return this.rowData.get(index)?.get?.('_id')
  }

  getRowIndex(rowId: string) {
    return this.rowIds.indexOf(rowId)
  }

  get rowIds() {
    return this.rowData.map(v => v.get('_id'))
  }

  get columnIds() {
    return this.columnData.map(v => v.get('_id'))
  }

  init(data: IWorksheetData) {
    const rowCount = Math.max(DEFAULT_WORKSHEET_ROW_COUNT, data?.rowCount ?? 0)
    const columnCount = Math.max(DEFAULT_WORKSHEET_COLUMN_COUNT, data?.columnCount ?? 0)
    const yjsRowData = new Y.Array<YjsRowDataMap>()
    const yjsColumnData = new Y.Array<YjsColumnDataMap>()
    const yjsCellMatrix = new YjsCellMatrix()

    yjsCellMatrix._sheetId = data.id

    yjsColumnData.push(new Array(columnCount).fill(0).map(() => new YjsColumnDataMap()))
    yjsRowData.push(new Array(rowCount).fill(0).map(() => new YjsRowDataMap()))

    this.set('rowData', yjsRowData)
    this.set('columnData', yjsColumnData)
    this.set('cellData', yjsCellMatrix)

    yjsColumnData.forEach(v => v.set('_id', getIdStr(v._item.id)))
    yjsRowData.forEach(v => v.set('_id', getIdStr(v._item.id)))

    Object.keys(data).forEach((key: keyof IWorksheetData) => {
      switch (key) {
        case 'columnCount':
        case 'rowCount':
        case 'scrollTop':
        case 'scrollLeft':
        case 'selections':
          break
        case 'cellData':
          yjsCellMatrix.init(data['cellData'], this)
          break
        case 'rowData':
          deepSet(this, [key], data[key])
          break
        case 'columnData':
          deepSet(this, [key], data[key])
          break
        case 'mergeData':
          this.set('mergeData', Y.Array.from(data.mergeData!))
          break
        default:
          this.set(key, data[key])
      }
    })
  }

  insertColumn(index: number, columns: IColumnData[]) {
    const yjsColumns = columns.map(v => new YjsColumnDataMap(Object.entries(v)))
    this.columnData.insert(index, yjsColumns)
    yjsColumns.forEach(v => v.set('_id', getIdStr(v._item.id)))
    // this.cellData.insertColumns(index, columns.length)
  }

  removeColumns(index: number, count: number) {
    // cellData 要先删
    this.cellData.removeColumns(index, count)
    this.columnData.delete(index, count)
  }

  removeRows(index: number, count: number) {
    // cellData 要先删
    this.cellData.removeRows(index, count)
    this.rowData.delete(index, count)
  }

  insertRow(index: number, rows: IRowData[]) {
    const yjsRows = rows.map(v => new YjsRowDataMap(Object.entries(v)))
    this.rowData.insert(index, yjsRows)
    yjsRows.forEach(v => v.set('_id', getIdStr(v._item.id)))
    // this.cellData.insertRows(index, rows.length)
  }

  override toJSON(): IWorksheetData {
    const base = super.toJSON()
    base.rowCount = this.rowCount
    base.columnCount = this.columnCount
    return base as IWorksheetData
  }

  /**
   * 检查 CellData 的 _row 和 _col 数据是否根据索引对齐
   */
  // _checkCellData() {
  //   this.cellData.forEachMatrix((cell, row, col) => {
  //     const colRelPos = Y.createRelativePositionFromJSON(cell.get('_col'))
  //     const rowRelPos = Y.createRelativePositionFromJSON(cell.get('_row'))
  //
  //     const colMatch = Y.compareRelativePositions(colRelPos, this.getRowOrColumnRelPos(this.columnData.get(col)))
  //     const rowMatch = Y.compareRelativePositions(rowRelPos, this.getRowOrColumnRelPos(this.columnData.get(row)))
  //
  //     if (!rowMatch || !colMatch) {
  //       console.error('错位', cell, row, col)
  //     }
  //   })
  // }
}