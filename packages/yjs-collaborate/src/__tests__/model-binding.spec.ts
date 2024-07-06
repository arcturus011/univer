import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ICommandService, LocaleType, LogLevel, Tools, Univer, UniverInstanceType, Workbook } from "@univerjs/core";
import { PeerGroup } from "./utils";
import { workbookExample } from './test-data/workbook.example.ts'
import { YjsWorkbook } from "../model/workbook.ts";
import {
  InsertColMutation,
  InsertRowMutation,
  RemoveColMutation,
  RemoveRowMutation,
  SetRangeValuesMutation
} from "@univerjs/sheets";
import { projectWorkbookToYjsWorkbook } from "../model-binding/mutations-to-y-events";

describe('model sync & binding', () => {
  const peerGroup = new PeerGroup()
  const peer = peerGroup.createPeer()
  const serverDoc = peerGroup.serverDoc

  afterAll(() => {
    peerGroup.destroy()
  })

  it('peer yjs model match', () => {
    // 初始化 server 内容
    projectWorkbookToYjsWorkbook(serverDoc.get('workbook', YjsWorkbook), Tools.deepClone(workbookExample))
    serverDoc.connect()
    peer.provider.connect()

    peerGroup.testConnector.syncAll()

    expect(peer.provider.workbook.toWorkbook()).toMatchObject(serverDoc.get('workbook', YjsWorkbook).toWorkbook())
  })

  it('peer snapshot match', () => {
    const snapshot: any = peer.workbook.getSnapshot()
    expect(snapshot).toMatchObject(workbookExample)

    // expect(snapshot.styles).toMatchObject(example1.styles)
    // expect(snapshot.sheetOrder).toMatchObject(example1.sheetOrder)
    // expect(snapshot.resources).toMatchObject(example1.resources)
    // expect(snapshot.sheets).toMatchObject(example1.sheets)
  })

  it('sync after cmd', () => {
    const commandService = peer.univerInstance.__getInjector().get(ICommandService)
    let sheetId = 'sheet-0011';
    commandService.syncExecuteCommand(InsertRowMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer.workbook.getUnitId(),
      "range": {
        "startRow": 0,
        "endRow": 0,
        "startColumn": 0,
        "endColumn": 20
      },
      "rowInfo": [{h: 99}],
      "trigger": "yjs-sync"
    }, {onlyLocal: false})

    commandService.syncExecuteCommand(InsertColMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer.workbook.getUnitId(),
      "range": {
        "startRow": 0,
        "endRow": 20,
        "startColumn": 0,
        "endColumn": 0
      },
      "colInfo": [{h: 88}],
      "trigger": "yjs-sync"
    }, {onlyLocal: false})

    commandService.syncExecuteCommand(RemoveColMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer.workbook.getUnitId(),
      "range": {
        "startRow": 0,
        "endRow": 20,
        "startColumn": 1,
        "endColumn": 1
      },
      "trigger": "yjs-sync"
    }, {onlyLocal: false})

    commandService.syncExecuteCommand(RemoveRowMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer.workbook.getUnitId(),
      "range": {
        "startRow": 1,
        "endRow": 1,
        "startColumn": 0,
        "endColumn": 20
      },
      "trigger": "yjs-sync"
    }, {onlyLocal: false})

    commandService.syncExecuteCommand(SetRangeValuesMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer.workbook.getUnitId(),
      "cellValue": {
        [3]: {
          [3]: {
            v: 'test',
            t: 1
          }
        }
      },
      "trigger": "yjs-sync"
    }, {onlyLocal: false})

    peerGroup.testConnector.syncAll()

    const serverYjsWorkbook = serverDoc.get('workbook', YjsWorkbook)

    const yjsCellData = serverYjsWorkbook.sheets.get(sheetId).cellData.getCellData(3, 3)
    if (!yjsCellData) {
      throw new Error('No getCellData available')
    }

    expect(yjsCellData.toJSON()).toEqual({v: 'test', t: 1})
    expect(peer.workbook.getSnapshot().sheets[sheetId].cellData[3][3]).toEqual({v: 'test', t: 1})
  })
})