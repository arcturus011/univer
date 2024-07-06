import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import {
  SetWorksheetOrderMutation
} from "@univerjs/sheets";
import { Injector } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetOrderHandler: IConversionHandler = {
  id: SetWorksheetOrderMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetOrderMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    console.log('handleSetWorksheetOrder', commandInfo)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    yjsWorkbook.setSheetOrder(sheetId, params.toOrder)

    console.log(yjsWorkbook.sheetOrder)
  }
}