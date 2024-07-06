/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Y from 'yjs';
import { IWorksheetData, Nullable, Tools } from '@univerjs/core';
import { YjsCellData } from './cell-data.ts';
import { YjsWorkbook } from './workbook.ts';
import type { YjsWorksheet } from './worksheet.ts';

export class YjsCellMatrix<ColumnType extends Y.Map<YjsCellData> = Y.Map<YjsCellData>> extends Y.Map<ColumnType> {
    static RefID = 9;

    override _write(_encoder) {
        _encoder.writeTypeRef(YjsCellMatrix.RefID);
    }

    constructor() {
        super();
    }

    get _sheetId(): string {
        return this.get('_sheetId') as unknown as string;
    }

    set _sheetId(value: string) {
        this.set('_sheetId', value as any);
    }

    get sheet(): YjsWorksheet {
        return this.doc.get('workbook', YjsWorkbook).sheets.get(this._sheetId);
    }

    init(data: IWorksheetData['cellData'], sheet: YjsWorksheet) {
        Object.keys(data).forEach((rowIndex) => {
            const rowId = sheet.getRowId(Number(rowIndex));
            let row = this.get(rowId);

            if (!row) {
                row = new Y.Map<YjsCellData>() as ColumnType;
                this.set(rowId, row);
            }

            const rowData = data[rowIndex] as IWorksheetData['cellData'][number];

          Object.keys(rowData).forEach((columnIndex) => {
            const columnId = sheet.getColumnId(Number(columnIndex));
            let yjsCellData = row.get(columnId)
            if (!yjsCellData) {
              yjsCellData = new YjsCellData();
              row.set(columnId, yjsCellData);
            }

            yjsCellData.init(rowData[columnIndex]);
          });
        });
    }

  // initObserver() {
  //   this.observeDeep(event => {
  //     console.log('YjsCellMatrix was modified', event)
  //   })
  // }

  // init(data: IcellM){
  //
  // }

  // private createRows(rowCount: number, columnCount: number): RowType[] {
  //   return new Array(rowCount).fill('').map(v => {
  //     const row = new Y.Array<any>() as RowType
  //     row.push(this.createColumns(columnCount))
  //     return row
  //   })
  // }

    private createColumns(count: number) {
        // return new Array(count).fill('').map((v) => new YjsCellData());
    }

  // createCellMatrix() {
  //   this.push(this.createRows(this.rowCount, this.columnCount))
  // }

    insertRows(index: number, count: number) {
    // this.insert(index, this.createRows(count, this.columnCount))
    }

    removeRows(index: number, count: number) {
        for (let i = index; i < count + index; i++) {
            this.delete(this.sheet.getRowId(i));
        }
    }

    insertColumns(index: number, count: number) {
    // this.forEach(row => {
    //   row.insert(index, new Array(count).fill('').map(v => new YjsCellData()))
    // })
    }

    removeColumns(index: number, count: number) {
        const columnIds: string[] = [];
        for (let i = index; i < index+count; i++) {
            columnIds.push(this.sheet.getColumnId(i));
        }

        this.forEach((row, key) => {
            if (key === '_sheetId') return; // @HACK

            columnIds.forEach((columnId) => {
                row.delete(columnId);
            });
        });
    }

    setValues(data: IWorksheetData['cellData']) {
        return this.init(data, this.sheet);
    }

    getCellData(row: number, col: number): Nullable<YjsCellData> {
        const rowId = this.sheet.getRowId(row);
        const columnId = this.sheet.getColumnId(col);
        return this.get(rowId)?.get?.(columnId);
    }

    forEachMatrix(cb: (cell: YjsCellData, row: number, col: number) => void) {
        this.sheet.rowIds.forEach((rowId, rowIndex) => {
            this.sheet.columnIds.forEach((columnId, colIndex) => {
                const cellData = this.get(rowId)?.get?.(columnId);
                if (!cellData) return;

                cb(cellData, rowIndex, colIndex);
            });
        });
    }

    override toJSON() {
        const cellData = {};

        this.forEachMatrix((cell, row, col) => {
            if (!cellData[row]) {
                cellData[row] = {};
            }

            cellData[row][col] = cell.toJSON();
        });

        return cellData;
    }
}
