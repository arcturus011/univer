import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { SetTabColorMutation } from "@univerjs/sheets";
import { ICommandInfo, Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetTabColorMutationHandler: IConversionHandler = {
  id: SetTabColorMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetTabColorMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    yjsSheet.set('tabColor', params.color)
  }
}
