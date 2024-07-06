// RemoveSheetMutation

import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { RemoveSheetMutation } from "@univerjs/sheets";
import { Injector } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const RemoveSheetHandler: IConversionHandler = {
  id: RemoveSheetMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof RemoveSheetMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const {subUnitId} = params;
    yjsWorkbook.removeSheet(subUnitId)
  }
}