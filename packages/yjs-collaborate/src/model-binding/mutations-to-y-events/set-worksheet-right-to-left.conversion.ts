// SetWorksheetRightToLeftMutation

import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import {
  SetWorksheetRightToLeftMutation,
} from "@univerjs/sheets";
import { ICommandInfo, Injector, Workbook } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetRightToLeftMutationHandler: IConversionHandler = {
  id: SetWorksheetRightToLeftMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetRightToLeftMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsSheet.set('rightToLeft', params.rightToLeft)
  }
}
