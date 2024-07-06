import type { IScale } from '@univerjs/core'
import type { SpreadsheetSkeleton, UniverRenderingContext } from '@univerjs/engine-render'
import {
  DEFAULT_FONTFACE_PLANE,
  FIX_ONE_PIXEL_BLUR_OFFSET,
  MIDDLE_CELL_POS_MAGIC_NUMBER,
  SheetExtension,
  getColor
} from '@univerjs/engine-render'
import { Inject, Injector } from "@univerjs/core";
import * as Y from 'yjs'
import { IYjsSyncProvider } from "../sync-provider";
import { ISelectionState } from "../service/selection.service.ts";
import { YjsWorkbook } from "../model/workbook.ts";

const UNIQUE_KEY = 'collaboratePeerSelectionExtension'

export class CollaboratePeerSelectionExtension extends SheetExtension {
  constructor(
    @Inject(Injector) readonly _injector: Injector,
    @Inject(IYjsSyncProvider) readonly syncProvider: IYjsSyncProvider
  ) {
    super();
  }

  override uKey = UNIQUE_KEY

  // Must be greater than 50
  override get zIndex() {
    return 50
  }

  override draw(ctx: UniverRenderingContext, parentScale: IScale, spreadsheetSkeleton: SpreadsheetSkeleton) {
    const {rowColumnSegment, worksheet} = spreadsheetSkeleton
    // const {startRow, endRow, startColumn, endColumn} = rowColumnSegment
    if (!spreadsheetSkeleton) {
      return
    }

    const {rowHeightAccumulation, columnTotalWidth, columnWidthAccumulation, rowTotalHeight} = spreadsheetSkeleton

    if (
      !rowHeightAccumulation
      || !columnWidthAccumulation
      || columnTotalWidth === undefined
      || rowTotalHeight === undefined
    ) {
      return
    }

    ctx.fillStyle = getColor([248, 249, 250])

    ctx.fillStyle = getColor([0, 0, 0])!
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.beginPath()
    ctx.lineWidth = 1

    ctx.translateWithPrecisionRatio(FIX_ONE_PIXEL_BLUR_OFFSET, FIX_ONE_PIXEL_BLUR_OFFSET)

    ctx.strokeStyle = getColor([217, 0, 0])
    ctx.font = `13px ${DEFAULT_FONTFACE_PLANE}`

    const yjsWorkbook = this._injector.get(YjsWorkbook)

    // console.log('states', this.syncProvider.awareness.getStates())

    this.syncProvider.awareness.getStates().forEach((value: { name: string, selection: ISelectionState }, clientID) => {
      if (!value || clientID == yjsWorkbook.doc.clientID) return

      if(value.selection.subUnitId !== worksheet.getSheetId()) return;

      const yjsWorksheet = yjsWorkbook.getOrCreateSheet(value.selection.subUnitId)
      if (!yjsWorksheet) return;

      const {name} = value
      const [startCellPos, endCellPos] = value.selection.relPos

      const startCol = yjsWorksheet.getColumnIndex(startCellPos.col)
      const startRow = yjsWorksheet.getRowIndex(startCellPos.row)
      const endCol = yjsWorksheet.getColumnIndex(endCellPos.col)
      const endRow = yjsWorksheet.getRowIndex(endCellPos.row)

      if ([
        startCol,
        startRow,
        endCol,
        endRow,
      ].some(v => v == -1)) {
        return;
      }


      // console.log('saaa', startRow, startCol)

      const top = rowHeightAccumulation[startRow - 1] ?? 0
      const left = columnWidthAccumulation[startCol - 1] ?? 0
      const width = columnWidthAccumulation[endCol] - left
      const height = rowHeightAccumulation[endRow] - top
      ctx.rect(left, top, width, height)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(name, left + width, top)
    })

    // ctx.rect(150, 150, 50, 50)

    // for (let r = startRow - 1; r <= endRow; r++) {
    //   if (r < 0 || r > rowHeightAccumulationLength - 1) {
    //     continue
    //   }
    //   const rowEndPosition = rowHeightAccumulation[r]
    //   if (preRowPosition === rowEndPosition) {
    //     // Skip hidden rows
    //     continue
    //   }
    //
    //   let preColumnPosition = 0
    //   const columnWidthAccumulationLength = columnWidthAccumulation.length
    //   for (let c = startColumn - 1; c <= endColumn; c++) {
    //     if (c < 0 || c > columnWidthAccumulationLength - 1) {
    //       continue
    //     }
    //
    //     const columnEndPosition = columnWidthAccumulation[c]
    //     if (preColumnPosition === columnEndPosition) {
    //       // Skip hidden columns
    //       continue
    //     }
    //
    //     // painting cell text
    //     const middleCellPosX = preColumnPosition + (columnEndPosition - preColumnPosition) / 2
    //     const middleCellPosY = preRowPosition + (rowEndPosition - preRowPosition) / 2
    //     customEmojiList[c] && ctx.fillText(customEmojiList[c], middleCellPosX-10, middleCellPosY + MIDDLE_CELL_POS_MAGIC_NUMBER) // Magic number 1, because the vertical alignment appears to be off by 1 pixel
    //     preColumnPosition = columnEndPosition
    //   }
    //
    //   preRowPosition = rowEndPosition
    // }
    ctx.stroke()
  }
}
