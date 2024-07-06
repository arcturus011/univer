import { ICommandInfo, type IMutation, Injector, IWorkbookData } from "@univerjs/core";
import { addWorksheetMergeHandler } from './add-worksheet-merge.conversion.ts'
import { RemoveWorksheetMergeHandler } from './remove-worksheet-merge.conversion.ts'
import { setRangeValuesHandler } from './set-range-values.conversion.ts'
import { SetWorksheetOrderHandler } from './set-worksheet-order.conversion.ts'
import { insertColHandler, insertRowHandler } from './insert-row-col.conversion.ts'
import { RemoveColHandler, RemoveRowHandler } from './remove-row-col.conversion.ts'
import { InsertSheetHandler } from './insert-sheet.conversion.ts'
import { RemoveSheetHandler } from './remove-sheet.conversion.ts'
import { YjsWorkbook } from "../../model/workbook.ts";
import { SetFrozenMutationHandler } from "./set-frozen.conversion.ts";
import { SetHideGridlinesMutationHandler } from "./set-hide-gridlines.conversion.ts";
import { SetColHiddenMutationHandler, SetColVisibleMutationHandler } from "./set-col-visible.conversion.ts";
import { SetRowHiddenMutationHandler, SetRowVisibleMutationHandler } from "./set-row-visible.conversion.ts";
import { SetTabColorMutationHandler } from "./set-tab-color.conversion.ts";
import { SetWorkbookNameMutationHandler } from "./set-workbook-name.conversion.ts";
import { SetWorksheetColWidthMutationHandler } from "./set-worksheet-col-width.conversion.ts";
import { SetWorksheetHideMutationHandler } from "./set-worksheet-hide.conversion.ts";
import { SetWorksheetNameMutationHandler } from "./set-worksheet-name.conversion.ts";
import {
  SetWorksheetRowAutoHeightMutationHandler,
  SetWorksheetRowHeightMutationHandler,
  SetWorksheetRowIsAutoHeightMutationHandler
} from "./set-worksheet-row-height.conversion.ts";
import { SetWorksheetRightToLeftMutationHandler } from "./set-worksheet-right-to-left.conversion.ts";
export type ExtractMutationParams<T> = T extends IMutation<infer P> ? P : never

export const HANDLER_REGISTRY = new Map<string, IConversionHandler>()

export interface IConversionHandler {
  handler(injector: Injector, commandInfo: ICommandInfo<any>): void

  id: string
}

export const mutationsToYEvents: IConversionHandler['handler'] = (injector, commandInfo) => {
  const _mutationHandler = HANDLER_REGISTRY.get(commandInfo.id)
  if (_mutationHandler) {
    return _mutationHandler.handler(injector, commandInfo)
  } else {

  }
}

export function register(handler: IConversionHandler) {
  HANDLER_REGISTRY.set(handler.id, handler)
}

register(addWorksheetMergeHandler)
register(RemoveWorksheetMergeHandler)
register(setRangeValuesHandler)
register(SetWorksheetOrderHandler)
register(insertColHandler)
register(insertRowHandler)
register(RemoveColHandler)
register(RemoveRowHandler)
register(InsertSheetHandler)
register(RemoveSheetHandler)
register(SetFrozenMutationHandler)
register(SetHideGridlinesMutationHandler)
register(SetColHiddenMutationHandler)
register(SetColVisibleMutationHandler)
register(SetRowVisibleMutationHandler)
register(SetRowHiddenMutationHandler)
register(SetTabColorMutationHandler)
register(SetWorkbookNameMutationHandler)
register(SetWorksheetColWidthMutationHandler)
register(SetWorksheetHideMutationHandler)
register(SetWorksheetNameMutationHandler)
register(SetWorksheetRowHeightMutationHandler)
register(SetWorksheetRowIsAutoHeightMutationHandler)
register(SetWorksheetRowAutoHeightMutationHandler)
register(SetWorksheetRightToLeftMutationHandler)

/**
 * 基于 workbookData 初始化 yjsWorkbook
 * @param yjsWorkbook
 * @param workbookData
 * @description 一般是服务器初始化数据用到该函数
 * @deprecated
 */
export function projectWorkbookToYjsWorkbook(yjsWorkbook: YjsWorkbook, workbookData: IWorkbookData) {
  console.log('projectWorkbookToYjsWorkbook')
  yjsWorkbook.init(workbookData)
}