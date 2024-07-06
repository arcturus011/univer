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

import { afterEach, beforeEach, describe, expect, it, assert, beforeAll, afterAll } from 'vitest';
import { YjsWorkbook } from '../model/workbook.ts'
import { projectWorkbookToYjsWorkbook } from "../model-binding/mutations-to-y-events";
import { PeerGroup, Peer } from "./utils";

// describe('Test workbook', () => {
//     let univer: Univer;
//     let workbook: Workbook;
//
//     beforeEach(() => {
//         const testBed = createCoreTestBed();
//         univer = testBed.univer;
//         workbook = testBed.sheet;
//     });
//
//     afterEach(() => univer.dispose());
//
//     describe('Test workbook function', () => {
//         it('function uniqueSheetName', () => {
//             const newSheetName = workbook.uniqueSheetName('Sheet-002');
//             expect(newSheetName).toBe('Sheet-002');
//
//             workbook.addWorksheet('sheet2', 1, {
//                 id: 'sheet2',
//                 name: newSheetName,
//             });
//
//             const newSheetName2 = workbook.uniqueSheetName('Sheet-002');
//             expect(newSheetName2).toBe('Sheet-0021');
//         });
//
//         it('function generateNewSheetName', () => {
//             const newSheetName = workbook.generateNewSheetName('Sheet');
//             expect(newSheetName).toBe('Sheet1');
//
//             workbook.addWorksheet('sheet3', 1, {
//                 id: 'sheet3',
//                 name: newSheetName,
//             });
//
//             const newSheetName2 = workbook.generateNewSheetName('Sheet');
//             expect(newSheetName2).toBe('Sheet2');
//         });
//     });
// });

describe('sheet-order', () => {
  let peer1: Peer
  let peer2: Peer
  let peerGroup: PeerGroup
  let yjsWorkbook1: YjsWorkbook
  let yjsWorkbook2: YjsWorkbook


  const syncDoc = () => {
    peerGroup.testConnector.syncAll()
  }

  beforeEach(() => {
    peerGroup = new PeerGroup()
    peer1 = peerGroup.createPeer()
    peer2 = peerGroup.createPeer()
    yjsWorkbook1 = peer1.provider.workbook
    yjsWorkbook2 = peer2.provider.workbook
  })

  afterAll(() => {
    // peerGroup.destroy()
  })

  it('move:manual', () => {
    const order = ['st001', 'st002', 'st003', 'st004', 'st005']
    projectWorkbookToYjsWorkbook(yjsWorkbook1, {sheetOrder: order} as any)

    expect(yjsWorkbook1.sheetOrder).toEqual(order)
    syncDoc()
    expect(yjsWorkbook2.sheetOrder).toEqual(order)

    yjsWorkbook1.setSheetOrder('st003', 0)
    // expect(yjsWorkbook2.sheetOrder).to.deep.eq(['st003', 'st001', 'st002', 'st004', 'st005'])
    yjsWorkbook1.setSheetOrder('st004', 0)
    // expect(yjsWorkbook2.sheetOrder).to.deep.eq(['st004', 'st003', 'st001', 'st002', 'st005'])

    yjsWorkbook2.setSheetOrder('st003', 1)
    syncDoc()

    expect(yjsWorkbook2.sheetOrder).toEqual(yjsWorkbook1.sheetOrder)
    expect(yjsWorkbook2.sheetOrder[0]).toEqual('st004')
  })

  it('random:move', () => {
    const COUNT = 300
    const order = new Array(COUNT).fill(1).map(() => Math.random().toString(36))
    projectWorkbookToYjsWorkbook(yjsWorkbook1, {sheetOrder: order} as any)
    syncDoc()
    expect(yjsWorkbook2.sheetOrderMap.toJSON()).toEqual(yjsWorkbook1.sheetOrderMap.toJSON())

    const moveRandom = (wb: YjsWorkbook) => {
      const randomId = order[Math.floor(Math.random() * order.length)]
      const randomIndex = Math.floor(Math.random() * order.length)
      wb.setSheetOrder(randomId, randomIndex)
    }

    for (let i = 0; i < COUNT + COUNT; i++) {
      moveRandom(yjsWorkbook1)
      moveRandom(yjsWorkbook2)
    }

    syncDoc()

    expect(yjsWorkbook2.sheetOrderMap.toJSON()).toEqual(yjsWorkbook1.sheetOrderMap.toJSON())
  })

  it('random:move add del', () => {
    const COUNT = 300
    const order = new Array(COUNT).fill(1).map(() => Math.random().toString(36))
    projectWorkbookToYjsWorkbook(yjsWorkbook1, {sheetOrder: order} as any)
    syncDoc()
    expect(yjsWorkbook2.sheetOrder).to.deep.eq(yjsWorkbook1.sheetOrder)

    const composedAction = (wb: YjsWorkbook) => {
      const action = {
        move() {
          const _order = wb.sheetOrder
          const randomId = _order[Math.floor(Math.random() * _order.length)]
          const randomIndex = Math.floor(Math.random() * _order.length)
          wb.setSheetOrder(randomId, randomIndex)
        },
        add() {
          const _order = wb.sheetOrder
          const randomId = Math.random().toString(36).slice(2)
          const randomIndex = Math.floor(Math.random() * (_order.length + 1))
          wb.setSheetOrder(randomId, randomIndex)
        },
        del() {
          const _order = wb.sheetOrder
          const randomId = wb.sheets[Math.floor(Math.random() * _order.length)]
          wb.sheetOrderMap.delete(randomId)
        }
      }

      const actions = Object.keys(action)

      action[actions[Math.floor(Math.random() * actions.length)]](wb)
    }

    for (let i = 0; i < COUNT + COUNT; i++) {
      composedAction(yjsWorkbook1)
      composedAction(yjsWorkbook2)
    }

    syncDoc()

    expect(yjsWorkbook2.sheetOrder).toEqual(yjsWorkbook1.sheetOrder)
  })
})

// describe('merge', () => {
// })