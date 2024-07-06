// SetWorksheetNameMutation

import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { SetWorksheetNameMutation } from "@univerjs/sheets";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetNameMutationHandler: IConversionHandler = {
  id: SetWorksheetNameMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetNameMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsSheet.set('name', params.name)
  }

}