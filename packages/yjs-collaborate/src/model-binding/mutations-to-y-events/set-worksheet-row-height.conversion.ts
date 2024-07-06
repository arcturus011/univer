import { type ExtractMutationParams, IConversionHandler } from "./index.ts";
import {
  SetWorksheetRowHeightMutation,
  SetWorksheetRowIsAutoHeightMutation,
  SetWorksheetRowAutoHeightMutation
} from "@univerjs/sheets";
import { ICommandInfo, Injector, Workbook } from "@univerjs/core";
import { YjsWorkbook } from "../../model/workbook.ts";

export const SetWorksheetRowHeightMutationHandler: IConversionHandler = {
  id: SetWorksheetRowHeightMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetRowHeightMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    const {unitId, subUnitId, ranges, rowHeight} = params;
    const workbook = injector.get(Workbook)
    const worksheet = workbook.getSheetBySheetId(sheetId)
    if (!worksheet) return
    const defaultRowHeight = worksheet.getConfig().defaultRowHeight;

    for (const {startRow, endRow} of ranges) {
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
        const row = yjsSheet.rowData.get(rowIndex);

        if (typeof rowHeight === 'number') {
          // row.h = rowHeight;
          row.set('h', rowHeight)
        } else {
          // row.h = rowHeight[rowIndex] ?? defaultRowHeight;
          row.set('h', rowHeight[rowIndex] ?? defaultRowHeight)
        }
        // row.h = Math.min(2000, row.h);
        row.set('h', Math.min(2000, row.h))
      }
    }
  }
}

export const SetWorksheetRowIsAutoHeightMutationHandler: IConversionHandler = {
  id: SetWorksheetRowIsAutoHeightMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetRowIsAutoHeightMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    const {unitId, subUnitId, ranges, autoHeightInfo} = params;
    const workbook = injector.get(Workbook)
    const worksheet = workbook.getSheetBySheetId(sheetId)
    if (!worksheet) return

    for (const { startRow, endRow } of ranges) {
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
        const row = yjsSheet.rowData.get(rowIndex);

        if (typeof autoHeightInfo === 'number') {
          // row.ia = autoHeightInfo;
          row.set('ia', autoHeightInfo)
        } else {
          // row.ia = autoHeightInfo[rowIndex - startRow] ?? undefined;
          row.set('ia', autoHeightInfo[rowIndex - startRow] ?? undefined)
        }
      }
    }
  }
}

export const SetWorksheetRowAutoHeightMutationHandler: IConversionHandler = {
  id: SetWorksheetRowAutoHeightMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetWorksheetRowAutoHeightMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    const {unitId, subUnitId, rowsAutoHeightInfo} = params;
    const workbook = injector.get(Workbook)
    const worksheet = workbook.getSheetBySheetId(sheetId)
    if (!worksheet) return

    for (const { row, autoHeight } of rowsAutoHeightInfo) {
      const curRow = yjsSheet.rowData.get(row);
      // curRow.ah = autoHeight;
      curRow.set('ah', autoHeight);
    }
  }
}