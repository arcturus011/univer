import { SetHideGridlinesMutation } from '@univerjs/sheets'
import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetHideGridlinesMutationHandler: IConversionHandler = {
  id: SetHideGridlinesMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetHideGridlinesMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsSheet.set('showGridlines', params.hideGridlines)
  }

}