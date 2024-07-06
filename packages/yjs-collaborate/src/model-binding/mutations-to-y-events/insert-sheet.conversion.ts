// InsertSheetMutation

import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { InsertSheetMutation } from "@univerjs/sheets";
import { Injector } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const InsertSheetHandler: IConversionHandler = {
  id: InsertSheetMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof InsertSheetMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const {sheet, index} = params;
    const yjsWorkSheet = yjsWorkbook.getOrCreateSheet(sheet.id)
    yjsWorkSheet.init(sheet)
    yjsWorkbook.setSheetOrder(sheet.id, index)
  }
}