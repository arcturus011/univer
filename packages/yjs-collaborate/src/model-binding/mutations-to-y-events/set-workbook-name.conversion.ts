// SetWorkbookNameMutation

import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { SetWorkbookNameMutation } from "@univerjs/sheets";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorkbookNameMutationHandler: IConversionHandler = {
  id: SetWorkbookNameMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorkbookNameMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    // const sheetId = params.subUnitId
    // const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsWorkbook.set('name', params.name)
  }
}
