import { ExtractMutationParams, IConversionHandler } from "./index.ts";
import { Injector, ObjectMatrix, Tools, Workbook } from "@univerjs/core";
import { ICommandInfo } from "@univerjs/core";
import { ISetRangeValuesMutationParams, SetRangeValuesMutation } from "@univerjs/sheets";
import { YjsWorkbook } from "../../model/workbook.ts";

export const setRangeValuesHandler: IConversionHandler = {
  id: SetRangeValuesMutation.id,
  handler(injector: Injector, commandInfo: ICommandInfo<ExtractMutationParams<typeof SetRangeValuesMutation>>) {
    const yjsWorkbook = injector.get(YjsWorkbook)
    console.log('handleSetRangeValues', commandInfo)
    const params = commandInfo.params!
    const sheetId = params.subUnitId
    const yjsSheet = yjsWorkbook.getOrCreateSheet(sheetId)
    if (!params.cellValue) return

    const workbook = injector.get(Workbook)
    const worksheet = injector.get(Workbook).getSheetBySheetId(sheetId);
    if (!worksheet) {
      return false;
    }

    const cellMatrix = worksheet.getCellMatrix();
    const res = new ObjectMatrix<any>();
    const newValues = new ObjectMatrix(params.cellValue);

    newValues.forValue((row, col, newVal) => {
      const oldVal = cellMatrix.getValue(row, col) || {};

      // handle style
      if (oldVal.s !== undefined) {
        const styles = workbook.getSnapshot()['styles']
        Object.keys(styles).forEach(styleId => {
          if (!Tools.diffValue(styles[styleId], yjsWorkbook.styles.get(styleId))) {
            yjsWorkbook.styles.set(styleId, styles[styleId])
          }
        })
      }

      res.setValue(row, col, oldVal);
    });

    yjsSheet.cellData.setValues(res.getMatrix())
    console.log('handleSetRangeValues done', res.getMatrix())
  }
}