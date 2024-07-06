import { createIdentifier } from '@univerjs/core'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { YjsWorkbook } from "../model/workbook.ts";
import { IEventEmitter } from "../utils/EventEmitter.ts";
import { YjsWorksheet } from "../model/worksheet.ts";
import { YjsCellMatrix } from "../model/cell-matrix.ts";
import { YjsCellData } from "../model/cell-data.ts";

export interface IYjsSyncProvider extends IEventEmitter {
  document: Y.Doc
  workbook: YjsWorkbook
  connect: HocuspocusProvider['connect']
  disconnect: HocuspocusProvider['disconnect']
  destroy: HocuspocusProvider['destroy']
  awareness: HocuspocusProvider['awareness']
}

export function registerYjsType() {
  Y.typeRefs[YjsWorkbook.RefID] = () => new YjsWorkbook()
  Y.typeRefs[YjsWorksheet.RefID] = () => new YjsWorksheet()
  Y.typeRefs[YjsCellMatrix.RefID] = () => new YjsCellMatrix()
  Y.typeRefs[YjsCellData.RefID] = () => new YjsCellData()
}

registerYjsType()

export const IYjsSyncProvider = createIdentifier<IYjsSyncProvider>('IYjsSyncProvider')