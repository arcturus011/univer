//

import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { SetWorksheetHideMutation } from "@univerjs/sheets";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetHideMutationHandler: IConversionHandler = {
  id: SetWorksheetHideMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetHideMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsSheet.set('hidden', params.hidden)
  }

}