import {
  ICommandService,
  LocaleType,
  LogLevel,
  Tools,
  Univer,
  UniverInstanceType,
  Workbook,
  Worksheet
} from "@univerjs/core";
import { YjsPlugin } from "../../plugin.ts";
import {
  InsertColMutation,
  RemoveRowMutation,
  SetRangeValuesMutation,
  InsertRowMutation,
  UniverSheetsPlugin, RemoveColMutation, AddWorksheetMergeMutation, RemoveWorksheetMergeMutation
} from "@univerjs/sheets";
import { YjsWorkbook } from "../../model/workbook.ts";
import { IYjsSyncProvider } from "../../sync-provider";
import { Injector } from "@univerjs/core/common/di.ts";
import { TestConnector, TestYInstance } from "./testHelper.ts";
import * as Y from 'yjs'
import * as prng from "lib0/prng";
import * as random from "lib0/random";
import { MockSyncProvider } from "../../sync-provider/mock.ts";

const gen = prng.create(random.uint32())

export function createUniver() {
// 新建 univer 实例
  const univer = new Univer({
    logLevel: LogLevel.VERBOSE,
  });

  // univer.registerPlugin(UniverRenderEnginePlugin);
  // univer.registerPlugin(UniverUIPlugin, {
  //   container: id,
  // });
  // univer.registerPlugin(UniverDocsPlugin, {
  //   hasScroll: false,
  // });
  // univer.registerPlugin(UniverDocsUIPlugin);
  univer.__getInjector().add([Univer, {useValue: univer}]);
  univer.registerPlugin(YjsPlugin);

  // sheets plugin
  univer.registerPlugin(UniverSheetsPlugin);
  // univer.registerPlugin(UniverSheetsUIPlugin);

  // sheet feature plugins
  // univer.registerPlugin(UniverSheetsNumfmtPlugin);
  // univer.registerPlugin(UniverSheetsFormulaPlugin);

  // create univer sheet instance
  // univer.createUnit(UniverInstanceType.UNIVER_SHEET, initialData);

  return univer
}

export function compareYjsWorkbookAndWorkbook(yjsWorkbook: YjsWorkbook, workbook: Workbook) {

}


export class Peer {
  univerInstance: Univer
  workbook: Workbook
  provider: IYjsSyncProvider

  constructor(public group: PeerGroup) {
    this.univerInstance = createUniver()
    this.provider = this.group.injector.createInstance(MockSyncProvider)
    this.univerInstance.__getInjector().add([IYjsSyncProvider, {useValue: this.provider}])
    this.workbook = this.univerInstance.createUnit(UniverInstanceType.UNIVER_SHEET, {})
  }

  destroy() {
    this.provider.destroy()
    this.univerInstance.dispose()
  }
}

export class PeerGroup {
  constructor() {
    this.testConnector = new TestConnector()
    this.injector.add([TestConnector, {useValue: this.testConnector}])
    this.serverDoc = this.testConnector.createY(0)
  }

  peers: Peer[] = []
  injector: Injector = new Injector()
  serverDoc: TestYInstance
  testConnector: TestConnector

  createPeer() {
    const peer = new Peer(this)
    this.peers.push(peer)
    return peer
  }

  destroy() {
    this.serverDoc.destroy()
    this.injector.dispose()
    this.peers.forEach(peer => {
      peer.destroy()
    })
  }
}

export function createWorksheet() {

}

export interface IRandomMutation {
  id: string,
  params: any
}

type IMutationCreator = (peer: Peer) => IRandomMutation['params']

export class RandomMutation {
  mutationMap = new Map<string, IMutationCreator>()

  getSheet(peer: Peer) {
    return peer.workbook.getSheetByIndex(0) as Worksheet
  }

  constructor() {
    this.mutationMap.set(InsertColMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const startCol = prng.int32(gen, 0, sheet.getColumnCount() - 1)
      // const endCol = prng.int32(gen, startCol, sheet.getColumnCount() - 1)
      const count = prng.int32(gen, 0, 20)

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "range": {
          "startRow": 0,
          "endRow": sheet.getRowCount() - 1,
          "startColumn": startCol,
          "endColumn": startCol + count - 1
        },
        "colInfo": new Array(count).fill(null).map(() => ({w: prng.int32(gen, 0, 200)})),
        "trigger": "yjs-sync"
      }
    })

    this.mutationMap.set(RemoveColMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const colCount = sheet.getColumnCount()
      if (colCount === 0) throw new Error('no cols')

      const startCol = prng.int32(gen, 0, colCount - 1)
      const endCol = prng.int32(gen, startCol, colCount - 1)

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "range": {
          "startRow": 0,
          "endRow": sheet.getRowCount() - 1,
          "startColumn": startCol,
          "endColumn": endCol
        },
        "trigger": "yjs-sync"
      }
    })

    this.mutationMap.set(InsertRowMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const startRow = prng.int32(gen, 0, sheet.getRowCount() - 1)
      const count = prng.int32(gen, 0, 20)

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "range": {
          "startRow": startRow,
          "endRow": startRow + count - 1,
          "startColumn": 0,
          "endColumn": sheet.getColumnCount() - 1
        },
        "rowInfo": new Array(count).fill(null).map(() => ({h: prng.int32(gen, 0, 200)})),
        "trigger": "yjs-sync"
      }
    })

    this.mutationMap.set(RemoveRowMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const rowCount = sheet.getRowCount()
      if (rowCount === 0) throw new Error('no rows')

      const startRow = prng.int32(gen, 0, rowCount - 1)
      const endRow = prng.int32(gen, startRow, rowCount - 1)
      // const endRow = Math.min(rowCount - 1, startRow + prng.int32(gen, 0, 20))

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "range": {
          "startRow": startRow,
          "endRow": endRow,
          "startColumn": 0,
          "endColumn": sheet.getColumnCount() - 1
        },
        "trigger": "yjs-sync"
      }
    })


    this.mutationMap.set(AddWorksheetMergeMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const startRow = prng.int32(gen, 0, sheet.getRowCount() - 1)
      const endRow = prng.int32(gen, startRow, sheet.getRowCount() - 1)
      const startColumn = prng.int32(gen, 0, sheet.getColumnCount() - 1)
      const endColumn = prng.int32(gen, startColumn, sheet.getColumnCount() - 1)

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "ranges": [{
          startRow,
          endRow,
          startColumn,
          endColumn
        }],
        "trigger": "yjs-sync"
      }
    })

    this.mutationMap.set(RemoveWorksheetMergeMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      const startRow = prng.int32(gen, 0, sheet.getRowCount() - 1)
      const endRow = prng.int32(gen, startRow, sheet.getRowCount() - 1)
      const startColumn = prng.int32(gen, 0, sheet.getColumnCount() - 1)
      const endColumn = prng.int32(gen, startColumn, sheet.getColumnCount() - 1)

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "ranges": [{
          startRow,
          endRow,
          startColumn,
          endColumn
        }],
        "trigger": "yjs-sync"
      }
    })

    this.mutationMap.set(SetRangeValuesMutation.id, (peer) => {
      const sheet = this.getSheet(peer)

      if (sheet.getRowCount() == 0) throw new Error('rowCount 为 0')

      const rowCount = prng.int32(gen, 1, sheet.getRowCount() / 5)


      const cellValue = {}

      for (let i = 0; i < rowCount; i++) {
        if (sheet.getColumnCount() == 0) throw new Error('colCount 为 0')

        cellValue[i] = {}
        const colCount = prng.int32(gen, 0, sheet.getColumnCount() / 3)


        if (prng.int32(gen, 0, 99) < 30) {
          break
        }

        for (let j = 0; j < colCount; j++) {
          if (prng.int32(gen, 0, 99) < 30) {
            cellValue[i][j] = {}
          } else {
            cellValue[i][j] = {
              v: prng.word(gen, 5, 20),
              t: 1
            }
          }
        }
      }

      return {
        "subUnitId": sheet.getSheetId(),
        "unitId": peer.workbook.getUnitId(),
        "cellValue": cellValue,
        "trigger": "yjs-sync"
      }
    })
  }

  getRandom(peer: Peer): IRandomMutation {
    const keys = Array.from(this.mutationMap.keys())
    const id = prng.oneOf(gen, keys)
    try {
      return {
        id: id,
        params: this.mutationMap.get(id)(peer)
      }
    } catch (err) {
      return null
    }
  }

  // genRandomMutations(len: number) {
  //   let mutations = []
  //   for (let i = 0; i <len; i++) {
  //
  //   }
  // }
}