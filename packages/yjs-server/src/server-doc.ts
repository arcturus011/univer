import * as Y from 'yjs'
import { YjsWorkbook } from 'yjs-collaborate/model/workbook.ts'

export class ServerDoc extends Y.Doc {
  get workbook() {
    return this.get('workbook', YjsWorkbook)
  }

  handlePermission() {
    // this
  }
}