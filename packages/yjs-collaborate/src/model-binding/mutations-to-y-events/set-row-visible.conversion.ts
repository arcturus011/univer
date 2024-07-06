import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import {
  SetRowVisibleMutation,
  SetRowHiddenMutation
} from "@univerjs/sheets";
import { BooleanNumber, ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetRowVisibleMutationHandler: IConversionHandler = {
  id: SetRowVisibleMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetRowVisibleMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    for (let i = 0; i < params.ranges.length; i++) {
      const range = params.ranges[i];
      for (let j = range.startRow; j < range.endRow + 1; j++) {
        const row = yjsSheet.rowData.get(j);
        if (row != null) {
          row.set('hd', 0);
        }
      }
    }
  }
}

export const SetRowHiddenMutationHandler: IConversionHandler = {
  id: SetRowHiddenMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetRowHiddenMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    for (let i = 0; i < params.ranges.length; i++) {
      const range = params.ranges[i];
      for (let j = range.startRow; j < range.endRow + 1; j++) {
        const row = yjsSheet.rowData.get(j);
        if (row != null) {
          row.set('hd', 1);
        }
      }
    }
  }
}
