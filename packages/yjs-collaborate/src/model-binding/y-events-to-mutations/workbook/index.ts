import { Disposable, ICommandService, Inject, Injector, IWorkbookData, IWorksheetData, Workbook } from "@univerjs/core";
import * as Y from "yjs";
import { InsertSheetMutation, RemoveSheetMutation, SetWorksheetOrderMutation } from "@univerjs/sheets";
import { YjsWorkbook } from "../../../model/workbook.ts";
import { WorksheetTransformer } from "../worksheet";
import { YjsWorksheet } from "../../../model/worksheet.ts";
import { isEmpty } from "lib0/object";

export type PropertyTransformer<T, validPropNames extends keyof T = keyof T> = {
  [key in validPropNames]: key extends validPropNames ? (...args: any[]) => any : never
}

export class TransformerBase extends Disposable {
  evt: Y.YEvent<any>

  handler(...args: any[]): any {
    throw new Error('not implemented');
  }

  protected default(...args: any[]): any {
    throw new Error('not implemented');
  }
}

export class WorkbookTransformer extends TransformerBase implements PropertyTransformer<IWorkbookData, 'sheets' | 'styles' | 'resources'> {
  workbook: Workbook;
  yjsWorkbook: YjsWorkbook;
  snapshot: IWorkbookData;

  constructor(
    @Inject(Injector) readonly injector: Injector,
  ) {
    super();
    this.yjsWorkbook = injector.get(YjsWorkbook)
    this.workbook = injector.get(Workbook)
    this.snapshot = injector.get(Workbook).getSnapshot()
  }

  deleteSheet(sheetId) {
    const commandService = this.injector.get(ICommandService)
    commandService.syncExecuteCommand(RemoveSheetMutation.id, {
      subUnitId: sheetId,
      "unitId": this.workbook.getUnitId(),
      "trigger": "yjs-sync"
    }, {onlyLocal: true})
  }

  addSheet(yjsWorksheet: YjsWorksheet) {
    const workbook = this.workbook

    const worksheetData = {
      cellData: {},
      rowData: {},
      columnData: {}
    } as IWorksheetData

    yjsWorksheet.forEach((value: Y.Array<any>, key) => {
      switch (key) {
        case 'cellData':
          yjsWorksheet.cellData.forEachMatrix((cellValue, row, col) => {
            const json = cellValue.toJSON()
            if (!isEmpty(json)) {
              if (!worksheetData['cellData'][row]) {
                worksheetData['cellData'][row] = {}
              }
              worksheetData['cellData'][row][col] = json
            }
          })
          break
        case 'mergeData':
          worksheetData[key] = yjsWorksheet.get(key).toJSON()
          break
        case 'rowData':
          yjsWorksheet.rowData.forEach((row, index) => {
            const json = row.toJSON()
            delete json._id
            if (!isEmpty(json)) {
              worksheetData[key][index] = json
            }
          })
          break
        case 'columnData':
          yjsWorksheet.columnData.forEach((col, index) => {
            const json = col.toJSON()
            delete json._id
            if (!isEmpty(json)) {
              worksheetData[key][index] = json
            }
          })
          break
        default:
          worksheetData[key] = value
      }

      // 补充两个不参与同步的计算属性
      worksheetData.rowCount = yjsWorksheet.rowCount
      worksheetData.columnCount = yjsWorksheet.columnCount
    })


    // if (!silent) {
    //   const commandService = this.injector.get(ICommandService)
    //   commandService.syncExecuteCommand(InsertSheetMutation.id, {
    //     "unitId": this.workbook.getUnitId(),
    //     sheet: worksheetData,
    //     index: workbook.getSheetSize(),
    //     "trigger": "yjs-sync"
    //   }, {onlyLocal: true})
    // } else {
      // this.yjsWorkbook.setSheetOrder(yjsWorksheet.id, workbook.getSheetSize())
      // const commandService = this.injector.get(ICommandService)
      // commandService.syncExecuteCommand(SetWorksheetOrderMutation.id, {
      //   "unitId": workbook.getUnitId(),
      //   "subUnitId": this.workbook.getSheetOrders()[0],
      //   fromOrder: 0,
      //   toOrder: 0,
      //   "trigger": "yjs-sync"
      // }, {onlyLocal: true})
      workbook.addWorksheet(yjsWorksheet.id, workbook.getSheetSize(), worksheetData)
    // }
  }

  /**
   * 替换默认的 workbook 数据
   * @description server 端发送全量的 yjsWorkbook 数据后，本地会进行一次更新
   * @TODO 是否考虑同步完，再统一初始化 univer workbook
   * @param evt
   */
  handleWorkbookInit(evt: Y.YEvent<YjsWorkbook>) {
    const injector = this.injector
    const snapshot = this.snapshot

    evt.keys.forEach((value, key) => {
      // 忽略 value.action，都是 add

      switch (key) {
        case 'styles':
          this.styles()
          break
        case 'sheets':
          // 删除默认的
          const existsSheet = Object.keys(snapshot['sheets'])
          this.yjsWorkbook.sheets.forEach((yjsWorksheet, sheetId) => {
            this.addSheet(yjsWorksheet)
          })

          existsSheet.forEach(sheetId => {
            this.deleteSheet(sheetId)
          })

          break
        case 'resources':
          this.resources()
          break
        case 'sheetOrderMap':
          snapshot['sheetOrder'] = this.yjsWorkbook.sheetOrder
          break
        default:
          this.default(key)
      }
    })
  }

  override handler(evt: Y.YEvent<YjsWorkbook>) {
    this.evt = evt
    this.workbook = this.injector.get(Workbook)
    this.snapshot = this.injector.get(Workbook).getSnapshot()

    // path.length === 0 意味着修改本身，一般是初始化时，特殊处理下
    if (!evt.path.length) {
      return this.handleWorkbookInit(this.evt)
    }

    // 判断第一层属性
    const propName = evt.path[0] as keyof IWorkbookData & 'sheetOrderMap'
    switch (propName) {
      case 'sheets':
        if (evt.path.length > 1) { // 说明精确到 sheet
          this.injector.get(WorksheetTransformer).handler(this, evt)
        } else if (evt.target === this.yjsWorkbook.sheets) {
          evt.keys.forEach((value, sheetId) => {
            switch (value.action) {
              case "update":
                throw new Error('未知 yjsWorkbook.sheets 操作')
              case "add":
                this.addSheet(this.yjsWorkbook.getOrCreateSheet(sheetId))
                break
              case "delete":
                this.deleteSheet(sheetId)
                break
            }
          })
        } else {
          throw new Error('未知 sheet 操作')
        }
        break
      case 'resources':
        this.resources()
        break
      case "sheetOrderMap":
        this.sheetOrder()
        break
      case "styles":
        // console.log(evt.path, evt.keys)
        evt.keys.forEach((value, styleId) => {
          switch (value.action) {
            case "update":
            case "add":
              // this.workbook.getStyles().setValue(this.yjsWorkbook.styles.get(styleId))
              this.snapshot['styles'][styleId] = this.yjsWorkbook.styles.get(styleId)
              break
            case "delete":
              delete this.snapshot['styles'][styleId]
          }
        })
        break
    }
  }

  sheets() {
  }

  styles() {
    this.snapshot['styles'] = Object.assign(this.snapshot['styles'], this.yjsWorkbook.get('styles').toJSON())
  }

  resources() {
    this.snapshot['resources'] = this.yjsWorkbook.get('resources').toJSON()
  }

  override default(key: string) {
    this.snapshot[key] = this.yjsWorkbook.get(key)
  }

  /**
   * 处理 sheetOrder 排序
   * @description sheetOrderMap 修改后，替换整个 snapshot 的 sheetOrder
   */
  sheetOrder() {
    const injector = this.injector
    const workbook = this.workbook
    const yjsWorkbook = this.yjsWorkbook

    const sheetOrder = yjsWorkbook.sheetOrder
    workbook.getConfig().sheetOrder.length = 0
    workbook.getConfig().sheetOrder.push(...sheetOrder)

    const commandService = injector.get(ICommandService)
    commandService.syncExecuteCommand(SetWorksheetOrderMutation.id, {
      "unitId": workbook.getUnitId(),
      "subUnitId": sheetOrder[0],
      fromOrder: 0,
      toOrder: 0,
      "trigger": "yjs-sync"
    }, {onlyLocal: true})
  }
}

