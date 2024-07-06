import {
  ICommandService,
  IContextService,
  Inject,
  Injector,
  IUniverInstanceService,
  Univer,
  Workbook
} from "@univerjs/core";
import { FUniver } from '@univerjs/facade'
import { CollaboratePeerSelectionExtension } from '../ui-extension/collaborate-peer-selection.extension.ts'
import { ISetSelectionsOperationParams } from "@univerjs/sheets";
import { YjsWorkbook } from "../model/workbook.ts";
import { IRenderManagerService, Spreadsheet } from "@univerjs/engine-render";
import { IYjsSyncProvider } from "../sync-provider";
// import { UniverType } from "@univerjs/protocol";

export interface ISelectionState {
  subUnitId: string
  relPos: [{ row: string, col: string }, { row: string, col: string }]
}

export class SelectionService {
  constructor(
    @Inject(Injector) readonly _injector: Injector,
    @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
    @ICommandService protected readonly _commandService: ICommandService,
    @IRenderManagerService private readonly _renderManagerService: IRenderManagerService,
    @Inject(IYjsSyncProvider) readonly syncProvider: IYjsSyncProvider,
    @IContextService private readonly _contextService: IContextService) {

    this.init()
  }

  init() {
    const univer = this._injector.get(Univer)
    console.log('SelectionService init')
    const univerAPI = FUniver.newAPI(univer)
    const unitId = this._injector.get(Workbook).getUnitId()
    univerAPI.getHooks().onRendered(() => {
      univerAPI.registerSheetMainExtension(unitId, this._injector.createInstance(CollaboratePeerSelectionExtension))
    })

    this.syncProvider.awareness.on('update', () => {
      const sss = this._univerInstanceService.getCurrentUnitForType<Workbook>(2)
      if(!sss) return

      // console.log('getActiveSheet', sss.getActiveSheet())
      // this.forceRender()
    })
  }

  forceRender() {
    this._renderManagerService.getRenderAll().forEach((renderer) => {
      if (renderer.mainComponent instanceof Spreadsheet) {
        (renderer.mainComponent as Spreadsheet).makeForceDirty(true);
      }
    })
  }

  setSelection(params: ISetSelectionsOperationParams) {
    const {subUnitId, selections} = params
    const selection = selections[0].range

    console.log(`selection: ${subUnitId}`, selections)
    const yjsWorkbook = this._injector.get(YjsWorkbook)
    const startCellRow = yjsWorkbook.getOrCreateSheet(subUnitId).getRowId(selection.startRow)
    const startCellCol = yjsWorkbook.getOrCreateSheet(subUnitId).getColumnId(selection.startColumn)
    const endCellRow = yjsWorkbook.getOrCreateSheet(subUnitId).getRowId(selection.endRow)
    const endCellCol = yjsWorkbook.getOrCreateSheet(subUnitId).getColumnId(selection.endColumn)

    this.syncProvider.awareness.setLocalStateField('selection', {
      subUnitId,
      relPos: [{
        row: startCellRow,
        col: startCellCol
      }, {
        row: endCellRow,
        col: endCellCol
      }]
    } as ISelectionState)

    this.forceRender()
  }
}