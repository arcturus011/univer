import * as Y from 'yjs'
import { YjsWorksheet } from "./worksheet.ts";
import { IStyleData, IWorkbookData, Nullable } from "@univerjs/core";
import * as fractionalIndex from 'fractional-indexing'
import { deepSet } from "../utils/deep-set.ts";

export interface IWorkBookResourceData {
  id?: string;
  name: string;
  data: string
}

export class YjsWorkbook extends Y.Map<any> {
  static RefID = 7

  override _write(_encoder) {
    _encoder.writeTypeRef(YjsWorkbook.RefID)
  }

  constructor() {
    super()
  }

  get id() {
    return this.get('id')
  }

  set id(value) {
    this.set('id', value)
  }

  get appVersion() {
    return this.get('appVersion')
  }

  set appVersion(value: string) {
    this.set('appVersion', value)
  }

  get name() {
    return this.get('name')
  }

  get sheets() {
    return this.get('sheets') as Y.Map<YjsWorksheet>
  }

  get sheetOrder() {
    const compareString = (a: string, b: string) => {
      if (a == b) {
        return 0
      } else if (a < b) {
        return -1
      } else {
        return 1
      }
    }
    return Array.from(this.sheetOrderMap.entries()).sort((a, b) => {
      if (a[1] == b[1]) {
        return compareString(a[0], b[0])
      } else {
        return compareString(a[1], b[1])
      }
    }).map(v => v[0])
  }

  get sheetOrderMap() {
    return this.get('sheetOrderMap') as Y.Map<string>
  }

  init(workbookData: IWorkbookData) {
    const yjsWorkbook = this

    yjsWorkbook.doc.transact(() => {
      yjsWorkbook.set('sheets', new Y.Map())
      yjsWorkbook.set('resources', new Y.Array())
      yjsWorkbook.set('sheetOrderMap', new Y.Map())
      yjsWorkbook.set('styles', new Y.Map())

      Object.keys(workbookData).forEach(key => {
        const value = workbookData[key]
        switch (key) {
          case 'styles':
            deepSet(yjsWorkbook, ['styles'], workbookData['styles'])
            break
          case 'sheetOrder':
            workbookData['sheetOrder'].forEach((sheetId, index) => {
              yjsWorkbook.setSheetOrder(sheetId, index)
            })
            break
          case 'sheets':
            Object.keys(workbookData['sheets']).forEach(sheetId => {
              const worksheet = workbookData['sheets'][sheetId]
              const yjsWorksheet = yjsWorkbook.getOrCreateSheet(sheetId)
              yjsWorksheet.init(worksheet as any)
            })
            break
          case 'resources':
            // TODO 不能只是简单处理，插件数据也需要协同
            workbookData['resources']?.forEach(res => {
              yjsWorkbook.resources.push([new Y.Map(Object.entries(res))])
            })
            break
          default:
            yjsWorkbook.set(key, value)
        }
      })
    })
  }

  setSheetOrder(id: string, index: number) {
    let prev = this.sheetOrder[index - 1] ? this.sheetOrderMap.get(this.sheetOrder[index - 1]) : null
    let next = this.sheetOrder[index] ? this.sheetOrderMap.get(this.sheetOrder[index]) : null
    this.sheetOrderMap.set(id, fractionalIndex.generateKeyBetween(prev as any, next as any))
  }

  get resources() {
    return this.get('resources') as Y.Array<Y.Map<IWorkBookResourceData>>
  }

  get styles() {
    return this.get('styles') as Y.Map<Nullable<IStyleData>>
  }

  getOrCreateSheet(id: string) {
    // if (!this.doc) throw new Error('doc 不存在')
    if (this.sheets.get(id) instanceof YjsWorksheet) return this.sheets.get(id)

    const sheet = new YjsWorksheet()
    sheet.set('id', id)
    this.sheets.set(id, sheet)
    return sheet
  }

  removeSheet(id: string) {
    this.sheets.delete(id)
    this.sheetOrderMap.delete(id)
  }

  override toJSON(): IWorkbookData {
    const base = super.toJSON();
    base.sheetOrder = this.sheetOrder
    delete base.sheetOrderMap
    return base as IWorkbookData
  }

  /**
   * @deprecated
   */
  toWorkbook() {
    return this.toJSON()
  }
}