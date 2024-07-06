import { Injector, createIdentifier } from "@univerjs/core";
import * as Y from 'yjs'
import { WorksheetTransformer } from "./worksheet";
import { WorkbookTransformer } from "./workbook";
import { CellMatrixTransformer } from "./cell-matrix";
import { CellDataTransformer } from "./cell-data";

export const IYEvents = createIdentifier<Y.YEvent<any>[]>('IYEvents')

export function initTransformer(injector: Injector) {
  injector.add([WorkbookTransformer])
  injector.add([WorksheetTransformer])
  injector.add([CellMatrixTransformer])
  injector.add([CellDataTransformer])
}

export function yEventsToMutations(injector: Injector, events: Y.YEvent<any>[], tran: Y.Transaction) {
  // 绑定一些依赖
  injector.add([IYEvents, {
    useValue: events
  }])
  injector.add([Y.Transaction, {
    useValue: tran
  }])

  events.forEach(evt => {
    injector.get(WorkbookTransformer).handler(evt)
  })
}