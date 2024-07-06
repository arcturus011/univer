import { SetFrozenMutation } from '@univerjs/sheets'
import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetFrozenMutationHandler: IConversionHandler = {
  id: SetFrozenMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetFrozenMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    const {startRow, startColumn, ySplit, xSplit} = params;

    yjsSheet.set('freeze', {startRow, startColumn, ySplit, xSplit})
  }

}