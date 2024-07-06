import {
  SetColHiddenMutation,
  SetColVisibleMutation
} from '@univerjs/sheets'
import { IConversionHandler, type ExtractMutationParams } from "./index.ts";
import { BooleanNumber, ICommandInfo, type IMutation, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";


export const SetColHiddenMutationHandler: IConversionHandler = {
  id: SetColHiddenMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetColHiddenMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    for (let i = 0; i < params.ranges.length; i++) {
      const range = params.ranges[i];
      for (let j = range.startColumn; j < range.endColumn + 1; j++) {
        const column = yjsSheet.columnData.get(j)
        if (column) {
          column.set('hd', BooleanNumber.TRUE)
        }
      }
    }
  }
}


export const SetColVisibleMutationHandler: IConversionHandler = {
  id: SetColVisibleMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetColVisibleMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    for (let i = 0; i < params.ranges.length; i++) {
      const range = params.ranges[i];
      for (let j = range.startColumn; j < range.endColumn + 1; j++) {
        const column = yjsSheet.columnData.get(j)
        if (column) {
          column.set('hd', BooleanNumber.FALSE)
        }
      }
    }
  }
}
