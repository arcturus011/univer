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

import 'react-mosaic-component/react-mosaic-component.css';
import './index.css';

import { LocaleType, LogLevel, Tools, Univer, UniverInstanceType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';

import { DEFAULT_WORKBOOK_DATA_DEMO } from '../data';
import { enUS, ruRU, zhCN } from '../locales';
import { YjsPlugin } from "yjs-collaborate";
import { MockSyncProvider } from "yjs-collaborate/sync-provider/mock.ts";
import { IYjsSyncProvider } from "yjs-collaborate/sync-provider/index.ts";
import { projectWorkbookToYjsWorkbook } from "yjs-collaborate/model-binding/mutations-to-y-events/index.ts";
import { TestConnector } from "yjs-collaborate/__tests__/utils/testHelper.ts";
import { YjsWorkbook } from "yjs-collaborate/model/workbook.ts";

const testConnector = new TestConnector()

function factory(id: string) {
    return function createUniverOnContainer() {
        const univer = new Univer({
            theme: defaultTheme,
            locale: LocaleType.ZH_CN,
            locales: {
                [LocaleType.ZH_CN]: zhCN,
                [LocaleType.EN_US]: enUS,
                [LocaleType.RU_RU]: ruRU,
            },
            logLevel: LogLevel.VERBOSE,
        });

        univer.registerPlugin(UniverRenderEnginePlugin);
        univer.registerPlugin(UniverUIPlugin, {
            container: id,
        });
        univer.registerPlugin(UniverDocsPlugin, {
            hasScroll: false,
        });
        univer.registerPlugin(UniverDocsUIPlugin);
        univer.__getInjector().add([Univer, {useValue: univer}]);
        univer.registerPlugin(YjsPlugin);

        // sheets plugin
        univer.registerPlugin(UniverSheetsPlugin);
        univer.registerPlugin(UniverSheetsUIPlugin);

        // sheet feature plugins
        univer.registerPlugin(UniverSheetsNumfmtPlugin);
        univer.registerPlugin(UniverSheetsFormulaPlugin);

        // create univer sheet instance
        // univer.createUniverSheet(Tools.deepClone(DEFAULT_WORKBOOK_DATA_DEMO));
      const injector = univer.__getInjector()

      injector.add([TestConnector, {useValue: testConnector}])

      const provider = injector.createInstance(MockSyncProvider)
      injector.add([IYjsSyncProvider, {useValue: provider}])

      const workbook = univer.createUnit(UniverInstanceType.UNIVER_SHEET, {})

      return {
        provider,
        univer,
        workbook
      }
    };
}

const TITLE_MAP: Record<ViewId, string> = {
    a: 'Sheet 1',
    b: 'Sheet 2',
    c: 'Sheet 3',
};

export type ViewId = 'a' | 'b' | 'c';

export function App() {
  const peer1Ref = useRef<any>(null);
  const peer2Ref = useRef<any>(null);
  const peer3Ref = useRef<any>(null);

  const [syncState, setSyncState] = useState({
    a: true,
    b: true,
    c: true,
  })

  useEffect(() => {
    const serverDoc = testConnector.createY(0)
    peer1Ref.current = factory('app-a')();
    peer2Ref.current = factory('app-b')();
    peer3Ref.current = factory('app-c')();

    (window as any).debugDocSet = () => {
      console.log(peer1Ref.current.provider.workbook.toWorkbook())
      console.log(peer1Ref.current.workbook.getSnapshot())
    }

    projectWorkbookToYjsWorkbook(serverDoc.get('workbook', YjsWorkbook), DEFAULT_WORKBOOK_DATA_DEMO)
    serverDoc.connect()
    testConnector.syncAll()

    setInterval(() => {
      testConnector.flushAllMessages()
    }, 300)
  }, []);

  const handleSwitchSync = (id: ViewId) => {
    switch (id) {
      case 'a':
        syncState[id] ? peer1Ref.current.provider.disconnect(): peer1Ref.current.provider.connect()
        break
      case 'b':
        syncState[id] ? peer2Ref.current.provider.disconnect(): peer2Ref.current.provider.connect()
        break
      case 'c':
        syncState[id] ? peer3Ref.current.provider.disconnect(): peer3Ref.current.provider.connect()
        break
    }

    setSyncState(state => {
      state[id] = !state[id]

      return {
        ...state
      }
    })
  }

    return (
        <Mosaic<ViewId>
            renderTile={(id, path) => (
                <MosaicWindow<ViewId>
                    path={path}
                    title={TITLE_MAP[id]}
                    toolbarControls={<div>
                      <button onClick={handleSwitchSync.bind(null, id)}>sync:{syncState[id] ? 'on': 'off'}</button>
                    </div>}
                >
                  <div id={`app-${id}`} style={{ height: '100%' }}>
                        {TITLE_MAP[id]}
                    </div>
                </MosaicWindow>
            )}
            initialValue={{
                direction: 'row',
                first: 'a',
                second: {
                    direction: 'column',
                    first: 'b',
                    second: 'c',
                },
            }}
        />
    );
};
createRoot(document.getElementById('container')!).render(<App />);
