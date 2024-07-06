// RemoveWorksheetMergeMutation

import { CommandType, ICommandInfo, IUniverInstanceService, Rectangle } from '@univerjs/core';
import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { RemoveWorksheetMergeMutation } from "@univerjs/sheets";
import { Injector } from "@univerjs/core";
import { YjsWorksheet } from "../../model/worksheet.ts";
import { YjsWorkbook } from "../../model/workbook.ts";

export const RemoveWorksheetMergeHandler: IConversionHandler = {
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof RemoveWorksheetMergeMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsWorksheet = yjsWorkbook.getOrCreateSheet(sheetId)
    const mergeConfigData = yjsWorksheet.mergeData.toArray();
    const mergeRemoveData = commandInfo.params!.ranges!;

    for (let j = 0; j < mergeRemoveData.length; j++) {
      mergeConfigData.forEach((configMerge, index, arr) => {
        const removeMerge = mergeRemoveData[j];
        if (Rectangle.intersects(configMerge, removeMerge)) {
          yjsWorksheet.mergeData.delete(index, 1);
          arr.splice(index, 1)
        }
      })
    }
    // console.log(mergeConfigData.toJSON())
  },
  id: RemoveWorksheetMergeMutation.id
}