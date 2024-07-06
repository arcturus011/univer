import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { Injector } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";
import {
  InsertColMutation,
  InsertRowMutation
} from "@univerjs/sheets";

export const insertRowHandler: IConversionHandler = {
  id: InsertRowMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof InsertRowMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    if (params.rowInfo) {
      yjsSheet.insertRow(params.range.startRow, Object.values(params.rowInfo))
    }

    // console.log(yjsSheet.toJSON())
  }

}

export const insertColHandler: IConversionHandler = {
  id: InsertColMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof InsertColMutation>>) {
    // console.log('handleInsertCol', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    if (params.colInfo) {
      yjsSheet.insertColumn(params.range.startColumn, Object.values(params.colInfo))
    }

    // console.log(yjsSheet.toJSON())
  }
}