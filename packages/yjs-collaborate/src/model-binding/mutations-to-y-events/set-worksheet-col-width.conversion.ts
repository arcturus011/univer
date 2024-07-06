//
import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import { SetWorksheetColWidthMutation } from "@univerjs/sheets";
import { ICommandInfo, Injector, Workbook } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetColWidthMutationHandler: IConversionHandler = {
  id: SetWorksheetColWidthMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetColWidthMutation>>) {
    // console.log('handleInsertRow', commandInfo)
    const yjsWorkbook = injector.get(YjsWorkbook)
    const workbook = injector.get(Workbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    const worksheet = workbook.getSheetBySheetId(sheetId)
    const ranges = params.ranges;
    if (!worksheet) return

    const defaultColumnWidth = worksheet.getConfig().defaultColumnWidth;

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      for (let j = range.startColumn; j < range.endColumn + 1; j++) {
        const column = yjsSheet.columnData.get(j);
        if (typeof params.colWidth === 'number') {
          // column.w = params.colWidth;
          column.set('w', params.colWidth)
        } else {
          // column.w = params.colWidth[j - range.startColumn] ?? defaultColumnWidth;
          column.set('w', params.colWidth[j - range.startColumn] ?? defaultColumnWidth)
        }
      }
    }
  }
}
