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

import {
  ICommandService,
  Plugin,
  UniverInstanceType,
  IUniverInstanceService,
  Workbook,
  ICommandInfo,
  IUndoRedoService
} from '@univerjs/core';
import { Inject, Injector } from '@univerjs/core';
import * as Y from 'yjs'
import { YjsWorkbook } from "./model/workbook.ts";
import { yEventsToMutations, mutationsToYEvents } from "./model-binding";
import { InsertSheetMutation, SetSelectionsOperation } from "@univerjs/sheets";
import { YjsUndoRedoService } from "./service/undoredo.service.ts";
import { SelectionService } from "./service/selection.service.ts";
import { IYjsSyncProvider } from "./sync-provider";
import { initTransformer } from "./model-binding/y-events-to-mutations";

export class YjsPlugin extends Plugin {
  static override pluginName = 'yjs-plugin';
  static override type = UniverInstanceType.UNIVER_SHEET;
  private cmdExecStack: ICommandInfo[];
  private workbook: Workbook;
  yjsWorkbook: YjsWorkbook

  // modelBindingInjector 是给 model-binding 命令用的，会重新定义一些 KV
  private modelBindingInjector: Injector
  undoManager: Y.UndoManager

  constructor(
    _config: unknown,
    @Inject(Injector) override readonly _injector: Injector,
    @Inject(ICommandService) private _commandService: ICommandService,
    @Inject(IUniverInstanceService) private _instanceService: IUniverInstanceService,
    @Inject(IYjsSyncProvider) private _syncProvider: IYjsSyncProvider,
  ) {
    super();
    // this.registerYjsType()
    this.doc = _syncProvider.document

    this._injector.add([Y.Doc, {
      useFactory: () => this.doc
    }])
    this._injector.add([SelectionService, {useClass: SelectionService, lazy: true}])
    this._injector.add([YjsPlugin, {useValue: this}])
    this._injector.replace([IUndoRedoService, {useClass: YjsUndoRedoService}])
    this.modelBindingInjector = this._injector.createChild()
  }

  doc: Y.Doc

  override onStarting(): void {
    console.log('[yjs plugin] onStarting', /*this._commandService, this.doc, this._instanceService*/)

    this.cmdExecStack = [];

    const sub = this._instanceService.getCurrentTypeOfUnit$(UniverInstanceType.UNIVER_SHEET).subscribe((wb: Workbook | null) => {
      if (!wb) return
      this.workbook = wb
      this.initWorkbook()
      sub.unsubscribe()
    });

    this._commandService.beforeCommandExecuted((commandInfo, options) => {

      this.cmdExecStack.push(commandInfo)
      // console.log('before cmd', commandInfo)

    })

    this._commandService.onCommandExecuted((commandInfo: ICommandInfo<any>, options) => {
      if (options?.onlyLocal) {
        // console.log('onlyLocal commandInfo', commandInfo)
        return
      }

      try {
        this.doc.transact(() => {
          mutationsToYEvents(this.modelBindingInjector, commandInfo);
        })
        this.cmdExecStack.pop()
      } catch (e) {
        console.log('mutationsToYEvents err', e, commandInfo)
      }

      switch (commandInfo.id) {
        case InsertSheetMutation.id:
          // case SetSelectionsOperation.id:
          console.log('after cmd', commandInfo)
      }
    })
  }

  listenYjsWorkbookEvents() {
    this.yjsWorkbook.observeDeep((events, tran) => {
      if (tran.local && !(tran.origin instanceof Y.UndoManager)) {
        return
      }

      yEventsToMutations(this.modelBindingInjector, events, tran);
    })
  }

  initUndoRedoManager() {
    const undoManager = this.undoManager = new Y.UndoManager(this.yjsWorkbook, {
      trackedOrigins: new Set([null])
    })

    undoManager.on('stack-item-added', event => {
      // save the current cursor location on the stack-item
      // event.stackItem.meta.set('cursor-location', getRelativeCursorLocation())
    })

    undoManager.on('stack-item-popped', event => {
      // restore the current cursor location on the stack-item
      // restoreCursorLocation(event.stackItem.meta.get('cursor-location'))
    })

    // console.log('undoManager', undoManager)
  }

  listenSelectionOperation() {
    this._commandService.onCommandExecuted((commandInfo: ICommandInfo<any>, options) => {
      if (options?.onlyLocal) {
        // console.log('onlyLocal commandInfo', commandInfo)
        return
      }

      switch (commandInfo.id) {
        case SetSelectionsOperation.id:
          if (!this._injector.has(Workbook)) break
          this._injector.get(SelectionService).setSelection(commandInfo.params)
          break
      }
    })

  }

  initWorkbook() {
    this.yjsWorkbook = this._syncProvider.workbook // this.createYjsWorkbook()
    this.initUndoRedoManager()

    // 注入参数依赖
    this._injector.add([YjsWorkbook, {useValue: this.yjsWorkbook}])
    this._injector.add([Y.UndoManager, {useValue: this.undoManager}])
    this._injector.add([Workbook, {
      useFactory: () => {
        return this.workbook
      }
    }])

    initTransformer(this.modelBindingInjector)

    this.listenYjsWorkbookEvents()
    this.listenSelectionOperation()
  }
}
