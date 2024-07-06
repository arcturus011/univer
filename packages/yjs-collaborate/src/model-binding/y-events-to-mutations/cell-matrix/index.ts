import { ICellData, ICommandService, Inject, Injector, Nullable, ObjectMatrix, Workbook } from "@univerjs/core";
import * as Y from "yjs";
import { SetRangeValuesMutation } from "@univerjs/sheets";
import { YjsCellData } from "../../../model/cell-data.ts";
import { PropertyTransformer, TransformerBase } from "../workbook";
import { WorksheetTransformer } from "../worksheet";
import { CellDataTransformer } from "../cell-data";
import { YjsCellMatrix } from "../../../model/cell-matrix.ts";

export class CellMatrixTransformer extends TransformerBase implements PropertyTransformer<{}> {
  parent: WorksheetTransformer;
  yjsCellMatrix: YjsCellMatrix;
  cellMatrix: ObjectMatrix<Nullable<ICellData>>;

  constructor(
    @Inject(Injector) readonly injector: Injector,
  ) {
    super();
  }

  override handler(parent: WorksheetTransformer, evt: Y.YEvent<any>) {
    this.evt = evt
    this.parent = parent
    const injector = this.injector

    const {path, delta, target} = evt
    const rowId = path[3] as string ?? ''
    const colId = path[4] as string ?? ''
    const worksheet = this.parent.worksheet
    const workbook = injector.get(Workbook)
    const commandService = injector.get(ICommandService)
    this.yjsCellMatrix = this.parent.yjsWorksheet.cellData
    this.cellMatrix = worksheet.getCellMatrix()

    const retainPath = path.slice(3)
    // const cellDataTransformer = this.injector.get(CellDataTransformer)
    console.log('retainPath', retainPath)

    switch (retainPath.length) {
      case 0: // 精确到行
        this.handleRow()
        break
      case 1: // 精确到列
        this.handleColumn(rowId)
        break
      case 2: // 精确到 cellValue
        this.handleCellValue(rowId, colId, this.yjsCellMatrix.get(rowId)?.get?.(colId))
        break
      case 3: // 精确到 cellValue 的属性，，一般是 custom 字段
        // const snapshot = this.cellMatrix.getValue(rowId, colId)
        // cellDataTransformer.handler(this, evt, snapshot)
        break
    }

    commandService.syncExecuteCommand(SetRangeValuesMutation.id, {
      "subUnitId": worksheet.getUnitId(),
      "unitId": workbook.getUnitId(),
      // "cellValue": {
      //   [row]: {
      //     [col]:  (target as YjsCellData).toJSON()
      //   }
      // },
      "trigger": "yjs-sync"
    }, {onlyLocal: true})
  }

  handleCellValue(rowId: string, columnId: string, cellData: YjsCellData | null) {
    if (!cellData) return
    const rowIndex = this.parent.yjsWorksheet.getRowIndex(rowId)
    const colIndex = this.parent.yjsWorksheet.getColumnIndex(columnId)

    if (rowIndex == -1 || colIndex == -1) {
      return;
    }
    // console.log('cellMatrix value', cellData.toJSON())
    this.cellMatrix.setValue(rowIndex, colIndex, cellData.toJSON() as ICellData)
  }

  handleRow() {
    // let currentIndex = 0;
    const {keys} = this.evt
    const cellMatrix = this.parent.worksheet.getCellMatrix()
    const yjsWorksheet = this.parent.yjsWorksheet

    keys.forEach((value, rowId) => {
      const rowIndex = yjsWorksheet.getRowIndex(rowId)
      if (rowIndex == -1) {
        return
      }

      switch (value.action) {
        case "delete":
          cellMatrix.setRow(rowIndex, undefined)
          break
        case "add":
        case "update":
          const rowData = this.yjsCellMatrix.get(rowId).toJSON()
          cellMatrix.setRow(rowIndex, {}) // 先清空 row
          Object.keys(rowData).forEach(colId => {
            const columnIndex = yjsWorksheet.getColumnIndex(colId)
            columnIndex !== -1 && cellMatrix.setValue(rowIndex, columnIndex, rowData[colId])
          })
          break
      }
    })

    // if (value.insert) {
    //   // cellMatrix.insertRows(currentIndex, action.insert.length)  跳过，处理 rowData 步骤，会触发 mutation，帮我们处理好了
    //   value.insert.forEach((row: Y.Array<YjsCellData>) => {
    //     row.toJSON().forEach((cellValue, colIndex) => {
    //       if (Object.keys(cellValue).length > 0) {
    //         cellMatrix.setValue(currentIndex, colIndex, cellValue)
    //       }
    //     })
    //     currentIndex++
    //   })
    // } else if (value.delete) {
    //   // cellMatrix.removeRows(currentIndex, action.delete) 跳过，处理 rowData 步骤，会触发 mutation，帮我们处理好了
    // } else if (value.retain) {
    //   currentIndex += value.retain
    // } else {
    //   console.error('handleRow error', value)
    // }
  }

  handleColumn(rowId: string) {
    // let currentIndex = 0;
    const {keys} = this.evt
    const cellMatrix = this.parent.worksheet.getCellMatrix()
    const yjsWorksheet = this.parent.yjsWorksheet
    const rowIndex = yjsWorksheet.getRowIndex(rowId)
    if (rowIndex == -1) return // 在已删除的行修改列

    keys.forEach((value, colId) => {
      const columnIndex = yjsWorksheet.getColumnIndex(colId)
      if (columnIndex == -1) return // 有可能插入在一个已删除的列

      switch (value.action) {
        case "delete":
          cellMatrix.setValue(rowIndex, columnIndex, undefined)
          break
        case "add":
        case "update":
          const cellData = this.yjsCellMatrix.get(rowId).get(colId).toJSON()
          cellMatrix.setValue(rowIndex, columnIndex, cellData)
          break
      }
    })

    // delta.forEach(action => {
    //   if (action.insert && Array.isArray(action.insert)) {
    //     // cellMatrix.insertColumns(currentIndex, action.insert.length) // 跳过，处理 columnData 步骤，会触发 mutation，帮我们处理好了
    //     action.insert.forEach((cellData: YjsCellData) => {
    //       const cellValue = cellData.toJSON()
    //       if (Object.keys(cellValue).length) {
    //         cellMatrix.setValue(rowId, currentIndex, cellValue as any)
    //       }
    //       currentIndex++
    //     })
    //   } else if (action.delete) {
    //     // cellMatrix.removeColumns(currentIndex, action.delete) // 跳过，处理 columnData 步骤，会触发 mutation，帮我们处理好了
    //   } else if (action.retain) {
    //     currentIndex += action.retain
    //   } else {
    //     console.error('handleColumn error', action)
    //   }
    // })
  }

  protected override default(key: string) {
  }
}