import { ICommandInfo } from '@univerjs/core';
import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { AddWorksheetMergeMutation } from "@univerjs/sheets";
import { Injector } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const addWorksheetMergeHandler: IConversionHandler = {
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof AddWorksheetMergeMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    // console.log('handleAddWorksheetMerge', commandInfo)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)

    const mergeConfigData = yjsSheet.mergeData;
    const mergeAppendData = params.ranges;
    mergeConfigData.push(mergeAppendData);
    console.log('mergeConfigData', mergeConfigData.toJSON())
  },
  id: AddWorksheetMergeMutation.id
}