import * as Y from "yjs";
import {
  AddWorksheetMergeMutation,
  InsertColMutation,
  InsertRowMutation, InsertSheetMutation,
  RemoveColMutation,
  RemoveRowMutation, RemoveSheetMutation, RemoveWorksheetMergeMutation,
} from "@univerjs/sheets";
import { Inject, Injector, IWorksheetData, RANGE_TYPE } from "@univerjs/core";
import { ICommandService, Worksheet } from "@univerjs/core";
import { CellMatrixTransformer } from "../cell-matrix";
import { YjsWorksheet } from "../../../model/worksheet.ts";
import { PropertyTransformer, TransformerBase, WorkbookTransformer } from "../workbook";

export class WorksheetTransformer extends TransformerBase implements PropertyTransformer<IWorksheetData, 'cellData' | 'mergeData' | 'rowData' | 'columnData'> {
  yjsWorksheet: YjsWorksheet
  worksheet: Worksheet
  parent: WorkbookTransformer
  commandService: ICommandService;
  sheetId: string;

  constructor(
    @Inject(Injector) readonly injector: Injector,
  ) {
    super();
    this.commandService = this.injector.get(ICommandService)
  }

  /**
   * 处理 worksheet 更新
   * @param parent
   * @param evt
   * @description 能进入此处，说明 path 一定是精确到具体的 sheet，而不是增删sheet
   *
   */
  override handler(parent: WorkbookTransformer, evt: Y.YEvent<any>) {
    this.parent = parent
    this.evt = evt

    const {path, keys} = evt

    this.sheetId = path[1] as string
    const sheetKey = path[2] as keyof IWorksheetData
    this.worksheet = parent.workbook.getSheetBySheetId(this.sheetId) as Worksheet
    this.yjsWorksheet = parent.yjsWorkbook.getOrCreateSheet(this.sheetId)

    if (!sheetKey) {
      //   说明是 sheet 本身修改
      return this.default()
    }

    switch (sheetKey) {
      case "cellData":
        this.cellData()
        break
      case "columnData":
        this.columnData()
        break
      case "rowData":
        this.rowData()
        break
      case "mergeData":
        this.mergeData()
        break
      case 'rowCount':
      case 'columnCount':
      case "selections":
        // 不处理
        break
    }
  }

  cellData() {
    this.injector.get(CellMatrixTransformer).handler(this, this.evt)
  }

  mergeData() {
    this.worksheet.getConfig().mergeData.length = 0
    this.worksheet.getConfig().mergeData.push(...this.yjsWorksheet.mergeData.toArray())
    // return;
    // const {delta} = this.evt
    // let currentIndex = 0
    // delta.forEach(action => {
    //   if (action.insert && Array.isArray(action.insert)) {
    //     this.worksheet.getConfig().mergeData.splice(currentIndex, ...action.insert)
    //     // this.commandService.syncExecuteCommand(AddWorksheetMergeMutation.id, {
    //     //   "unitId": this.parent.workbook.getUnitId(),
    //     //   "subUnitId": this.sheetId,
    //     //   "ranges": action.insert,
    //     //   "trigger": "yjs-sync"
    //     // }, {onlyLocal: true})
    //     currentIndex += action.insert.length
    //   } else if (action.delete) {
    //     // 手动改下
    //     this.worksheet.getConfig().mergeData.splice(currentIndex, action.delete)
    //     // this.commandService.syncExecuteCommand(RemoveWorksheetMergeMutation.id, {
    //     //   "unitId": this.parent.workbook.getUnitId(),
    //     //   "subUnitId": this.sheetId,
    //     //   ranges: [],
    //     //   "trigger": "yjs-sync"
    //     // }, {onlyLocal: true})
    //   } else if (action.retain) {
    //     currentIndex += action.retain
    //   }
    // })
  }

  rowData() {
    const {delta} = this.evt

    let currentIndex = 0
    delta.forEach(action => {
      if (action.insert && Array.isArray(action.insert)) {
        this.commandService.syncExecuteCommand(InsertRowMutation.id, {
          "unitId": this.parent.workbook.getUnitId(),
          "subUnitId": this.sheetId,
          "range": {
            "startRow": currentIndex,
            "endRow": currentIndex + action.insert.length - 1,
            "startColumn": 0,
            "endColumn": this.worksheet.getColumnCount() - 1,
            "rangeType": RANGE_TYPE.ROW
          },
          "rowInfo": action.insert.map(v => this.filterRowOrColumnProp(v.toJSON() ?? {})),
          "trigger": "yjs-sync"
        }, {onlyLocal: true})
        currentIndex += action.insert.length
      } else if (action.delete) {
        this.commandService.syncExecuteCommand(RemoveRowMutation.id, {
          "unitId": this.parent.workbook.getUnitId(),
          "subUnitId": this.sheetId,
          "range": {
            "startRow": currentIndex,
            "startColumn": 0,
            "endRow": currentIndex + action.delete - 1,
            "endColumn": this.worksheet.getColumnCount() - 1,
            "rangeType": RANGE_TYPE.ROW
          },
          "trigger": "yjs-sync"
        }, {onlyLocal: true})
      } else if (action.retain) {
        currentIndex += action.retain
      }
    })
  }

  filterRowOrColumnProp(v: any) {
    delete v._id
    return v
  }

  columnData() {
    const {delta} = this.evt

    let currentIndex = 0
    console.log('columnData', delta)
    delta.forEach(action => {
      if (action.insert && Array.isArray(action.insert)) {
        this.commandService.syncExecuteCommand(InsertColMutation.id, {
          "unitId": this.parent.workbook.getUnitId(),
          "subUnitId": this.sheetId,
          "range": {
            "startColumn": currentIndex,
            "endColumn": currentIndex + action.insert.length - 1,
            "startRow": 0,
            "endRow": this.worksheet.getRowCount() - 1,
            "rangeType": RANGE_TYPE.COLUMN
          },
          "colInfo": action.insert.map(v => this.filterRowOrColumnProp(v.toJSON() ?? {})),
          "trigger": "yjs-sync"
        }, {onlyLocal: true})
        currentIndex += action.insert.length
      } else if (action.delete) {
        this.commandService.syncExecuteCommand(RemoveColMutation.id, {
          "unitId": this.parent.workbook.getUnitId(),
          "subUnitId": this.sheetId,
          "range": {
            "startRow": 0,
            "startColumn": currentIndex,
            "endRow": this.worksheet.getRowCount() - 1,
            "endColumn": currentIndex + action.delete - 1,
            "rangeType": RANGE_TYPE.COLUMN
          },
          "trigger": "yjs-sync"
        }, {onlyLocal: true});
      } else if (action.retain) {
        currentIndex += action.retain
      }
    })
  }

  protected override default(): any {
    const {keys} = this.evt
    const snapshot = this.worksheet.getSnapshot()

    keys.forEach((value, key) => {
      switch (value.action) {
        case "delete":
          delete snapshot[key]
          break
        case "add":
        case "update":
          snapshot[key] = this.yjsWorksheet.get(key)
          break
      }
    })
  }
}



