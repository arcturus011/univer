import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PeerGroup, Peer, RandomMutation, IRandomMutation } from "./utils";
import { projectWorkbookToYjsWorkbook } from "../model-binding/mutations-to-y-events";
import { YjsWorkbook } from "../model/workbook.ts";
import { ICommandService, Tools, Worksheet } from "@univerjs/core";
import { workbookExample } from "./test-data/workbook.example.ts";
import {
  AddWorksheetMergeMutation,
  type IInsertSheetMutationParams,

  InsertSheetMutation,

  RemoveSheetMutation, RemoveWorksheetMergeMutation,
  SetWorksheetOrderMutation
} from "@univerjs/sheets";
import { worksheetExample } from "./test-data/worksheet.example.ts";

const sheetId = 'sheet-0011';

const randomMutation = new RandomMutation()

const matchCellData = (sheet: Worksheet, peer: Peer) => {
  const noEmptyMatrix = Tools.deepClone(Tools.removeNull(sheet.getCellMatrix().getMatrix())) // 没有空行空列
  Object.keys(noEmptyMatrix).forEach(row => {
    if (Tools.isEmptyObject(noEmptyMatrix[row])) {
      delete noEmptyMatrix[row]
    } else {
      Object.keys(noEmptyMatrix[row]).forEach(col => {
        if (Tools.isEmptyObject(noEmptyMatrix[row][col])) {
          delete noEmptyMatrix[row][col]
        }
      })
    }
  })

  expect(Tools.removeNull(peer.provider.workbook.getOrCreateSheet(sheetId).cellData.toJSON())).toMatchObject(noEmptyMatrix)
}


describe('MultiPeers', () => {
  const peerGroup = new PeerGroup()
  const peer1 = peerGroup.createPeer()
  const peer2 = peerGroup.createPeer()
  const peer3 = peerGroup.createPeer()

  beforeAll(() => {
    projectWorkbookToYjsWorkbook(peerGroup.serverDoc.get('workbook', YjsWorkbook), Tools.deepClone(workbookExample))
    peerGroup.testConnector.syncAll()
  })

  it('model match after init', () => {
    const snapshot1 = peer1.workbook.getSnapshot()
    const snapshot2 = peer2.workbook.getSnapshot()
    const snapshot3 = peer3.workbook.getSnapshot()
    const sheet1 = peer1.workbook.getSheetBySheetId(sheetId) as Worksheet
    const sheet2 = peer2.workbook.getSheetBySheetId(sheetId) as Worksheet
    const sheet3 = peer3.workbook.getSheetBySheetId(sheetId) as Worksheet

    // yjs 之间模型匹配
    expect(peer1.provider.workbook.toWorkbook()).toEqual(peer2.provider.workbook.toWorkbook())
    expect(peer2.provider.workbook.toWorkbook()).toEqual(peer3.provider.workbook.toWorkbook())


    // yjs 和 univer 的模型一致
    expect(Tools.removeNull(peer1.provider.workbook.getOrCreateSheet(sheetId).cellData.toJSON())).toMatchObject(Tools.removeNull(sheet1.getCellMatrix().getMatrix()))

    // univer 之间模型匹配
    expect(snapshot1).toMatchObject(snapshot3)
    expect(snapshot1).toMatchObject(snapshot2)
  })

  it('random mutation', () => {
    for (let i = 0; i < 300; i++) {
      ;[peer1, peer2, peer3].forEach(p => {
        const m = randomMutation.getRandom(p)
        if (!m) return;
        const commandService = p.univerInstance.__getInjector().get(ICommandService)
        commandService.syncExecuteCommand(m.id, m.params, {onlyLocal: false})
      })
    }

    // 同步
    peerGroup.testConnector.syncAll()

    // yjs 模型匹配
    expect(peer3.provider.workbook.toJSON()).toMatchObject(peer1.provider.workbook.toJSON())
    expect(peer2.provider.workbook.toJSON()).toMatchObject(peer1.provider.workbook.toJSON())


    // univer 模型匹配
    const snapshot1 = peer1.workbook.getSnapshot()
    const snapshot2 = peer2.workbook.getSnapshot()
    const snapshot3 = peer3.workbook.getSnapshot()
    const sheet1 = peer1.workbook.getSheetBySheetId(sheetId) as Worksheet
    const sheet2 = peer2.workbook.getSheetBySheetId(sheetId) as Worksheet
    const sheet3 = peer3.workbook.getSheetBySheetId(sheetId) as Worksheet

    // yjs 和 univer 的模型一致
    matchCellData(sheet1, peer1)
    matchCellData(sheet2, peer2)
    matchCellData(sheet3, peer3)

    expect(snapshot1.styles).toMatchObject(snapshot3.styles)
    expect(snapshot2.styles).toMatchObject(snapshot3.styles)
    expect(snapshot1.resources).toMatchObject(snapshot3.resources)
    expect(snapshot2.resources).toMatchObject(snapshot3.resources)

    expect(Tools.removeNull(sheet1.getRowManager().getRowData())).toMatchObject(Tools.removeNull(sheet3.getRowManager().getRowData()))

    expect(peer1.provider.workbook.getOrCreateSheet(sheetId).rowCount).toEqual(sheet1.getRowCount())
    expect(peer2.provider.workbook.getOrCreateSheet(sheetId).rowCount).toEqual(sheet2.getRowCount())
    expect(peer3.provider.workbook.getOrCreateSheet(sheetId).rowCount).toEqual(sheet3.getRowCount())

    expect(peer1.provider.workbook.getOrCreateSheet(sheetId).columnCount).toEqual(sheet1.getColumnCount())
    expect(peer2.provider.workbook.getOrCreateSheet(sheetId).columnCount).toEqual(sheet2.getColumnCount())
    expect(peer3.provider.workbook.getOrCreateSheet(sheetId).columnCount).toEqual(sheet3.getColumnCount())

    expect(sheet1.getRowCount()).toEqual(sheet2.getRowCount())
    expect(sheet3.getRowCount()).toEqual(sheet2.getRowCount())

    expect(Tools.removeNull(sheet1.getRowManager().getRowData())).toMatchObject(Tools.removeNull(sheet3.getRowManager().getRowData()))
    expect(Tools.removeNull(sheet1.getColumnManager().getColumnData())).toMatchObject(Tools.removeNull(sheet3.getColumnManager().getColumnData()))
    expect(Tools.removeNull(snapshot1.sheets[sheetId].cellData)).toMatchObject(Tools.removeNull(snapshot3.sheets[sheetId].cellData))
    expect(Tools.removeNull(snapshot2.sheets[sheetId].cellData)).toMatchObject(Tools.removeNull(snapshot3.sheets[sheetId].cellData))

    expect(sheet3.getMergeData()).toEqual(sheet1.getMergeData())
    expect(sheet2.getMergeData()).toEqual(sheet1.getMergeData())
  })

  it('add or remove merge', () => {
    const commandService1 = peer1.univerInstance.__getInjector().get(ICommandService)
    const commandService2 = peer2.univerInstance.__getInjector().get(ICommandService)

    commandService1.syncExecuteCommand(AddWorksheetMergeMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer1.workbook.getUnitId(),
      "ranges": [{
        "startRow": 1,
        "endRow": 5,
        "startColumn": 2,
        "endColumn": 3
      }],
    })

    commandService2.syncExecuteCommand(RemoveWorksheetMergeMutation.id, {
      "subUnitId": sheetId,
      "unitId": peer2.workbook.getUnitId(),
      "ranges": [{
        startRow: 4, endRow: 5, startColumn: 10, endColumn: 10
      }],
    })

    peerGroup.testConnector.syncAll()

    const sheet3 = peer3.workbook.getSheetBySheetId(sheetId) as Worksheet
    const sheet1 = peer1.workbook.getSheetBySheetId(sheetId) as Worksheet
    expect(sheet3.getMergeData()).toEqual(sheet1.getMergeData())
  })

  it('add or remove sheet', () => {
    const commandService1 = peer1.univerInstance.__getInjector().get(ICommandService)
    const commandService2 = peer2.univerInstance.__getInjector().get(ICommandService)
    const commandService3 = peer3.univerInstance.__getInjector().get(ICommandService)

    commandService1.syncExecuteCommand(InsertSheetMutation.id, {
      index: 0,
      sheet: Tools.deepClone(worksheetExample),
      unitId: peer1.workbook.getUnitId()
    } as IInsertSheetMutationParams)

    // console.log(peer1.workbook.getSnapshot())
    // console.log(peer2.workbook.getActiveSheet().getSheetId(), peer2.workbook.getSnapshot())
    commandService2.syncExecuteCommand(SetWorksheetOrderMutation.id, {
      subUnitId: sheetId,
      unitId: peer2.workbook.getUnitId(),
      fromOrder: 1,
      toOrder: 0,
    })

    peerGroup.testConnector.syncAll()
    expect(peer3.provider.workbook.sheets.size).toEqual(2)
    expect(peer1.workbook.getSheetOrders()).toEqual(peer3.workbook.getSheetOrders())
    expect(peer1.workbook.getSheetOrders()[0]).toEqual(sheetId)

    commandService2.syncExecuteCommand(RemoveSheetMutation.id, {
      subUnitId: sheetId,
      unitId: peer2.workbook.getUnitId(),
      // subUnitName: peer2.workbook.getActiveSheet().getName()
    })

    peerGroup.testConnector.syncAll()
    expect((peer1.workbook.getSheetBySheetId('sheet-01') as Worksheet).getName()).toEqual('Sheet1')


    expect(peer2.provider.workbook.sheets.size).toEqual(1)
    expect(peer2.workbook.getSheetSize()).toEqual(1)
  })
})