import { IYjsSyncProvider } from "./index.ts";
import { TestConnector, TestYInstance } from "../__tests__/utils/testHelper.ts";
import EventEmitter from "../utils/EventEmitter.ts";
import { YjsWorkbook } from "../model/workbook.ts";
import { Inject, Injector } from "@univerjs/core";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness'

let mockClientID = 100

export const awarenessSet = new Set<Awareness>()

export function broadcastAwareness(enc: Uint8Array, from: Awareness) {
  awarenessSet.forEach(awareness => {
    if(from == awareness) return
    applyAwarenessUpdate(awareness, enc, 'server')
  })
}

export class MockSyncProvider extends EventEmitter implements IYjsSyncProvider {
  awareness: Awareness;


  constructor(
    @Inject(Injector) readonly _injector: Injector,
    @Inject(TestConnector) readonly testConnector: TestConnector,
  ) {
    super()
    this.document = testConnector.createY(mockClientID++ /*?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)*/)
    this.awareness = new Awareness(this.document)
    awarenessSet.add(this.awareness)
    this.awareness.setLocalStateField('name', mockClientID)
    this.awareness.on('update', this.awarenessUpdateHandler.bind(this))
  }

  get workbook() {
    return this.document.get('workbook', YjsWorkbook)
  }

  awarenessUpdateHandler({added, updated, removed}: any, origin: any) {
    // console.log('update', origin)
    if (origin !== 'local') return // 只有 local发出的，才广播

    const changedClients = added.concat(updated).concat(removed)

    const enc = encodeAwarenessUpdate(this.awareness, changedClients)

    broadcastAwareness(enc, this.awareness)
  }

  async connect() {
    this.document.connect()

    await Promise.resolve();
    this.emit('synced');
  }

  disconnect() {
    this.document.disconnect()
    // removeAwarenessStates(this.awareness, [this.document.clientID], 'provider destroy')
  }

  destroy() {
    this.disconnect()
    this.document.destroy()
    awarenessSet.delete(this.awareness)
  }

  document: TestYInstance;
}