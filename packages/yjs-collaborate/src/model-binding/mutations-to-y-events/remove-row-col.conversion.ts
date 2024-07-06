
import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import {
  RemoveColMutation,
  RemoveRowMutation
} from "@univerjs/sheets";
import type { Injector } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const RemoveRowHandler: IConversionHandler = {
  id: RemoveRowMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof RemoveRowMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    console.log('handleRemoveRow', commandInfo)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    yjsSheet.removeRows(params.range.startRow, params.range.endRow - params.range.startRow + 1)

    // console.log(yjsSheet.toJSON())
  }

}

export const RemoveColHandler: IConversionHandler = {
  id: RemoveColMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof RemoveColMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    console.log('handleRemoveColumn', commandInfo)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    yjsSheet.removeColumns(params.range.startColumn, params.range.endColumn - params.range.startColumn + 1)

    // console.log(yjsSheet.toJSON())
  }
}