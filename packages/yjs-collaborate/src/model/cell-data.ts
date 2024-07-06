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
import type { CellValue, ICellData } from '@univerjs/core';
import { Tools } from '@univerjs/core';
import { deepSet } from '../utils/deep-set.ts';

export class YjsCellData extends Y.Map<any> implements ICellData {
    static RefID = 10;

    init(data: ICellData) {
        if (data.custom && !this.custom) {
            this.set('custom', new Y.Map<any>());
        }

      if (Tools.isEmptyObject(data)) {
        this.forEach((_, key) => {
          this.set(key, null)
        })
      } else {
        Object.keys(data).forEach((key: keyof ICellData) => {
          switch (key) {
            case 'custom':
              deepSet(this, ['custom'], data[key]);
              break;
            default:
              this.set(key, data[key]);
          }
        });
      }
    }

    override _write(_encoder) {
        _encoder.writeTypeRef(YjsCellData.RefID);
    }

    constructor(props?: [string, CellValue][]) {
        super(props);
    }

    get v() {
        return this.get('v');
    }

    get p() {
        return this.get('p');
    }

    set p(value) {
        this.set('p', value);
    }

    get s() {
        return this.get('s');
    }

    set s(value) {
        this.set('s', value);
    }

    get t() {
        return this.get('t');
    }

    set t(value) {
        this.set('t', value);
    }

    get f() {
        return this.get('f');
    }

    set f(value) {
        this.set('f', value);
    }

    get si() {
        return this.get('si');
    }

    set si(value) {
        this.set('si', value);
    }

    get custom() {
        return this.get('custom');
    }
}
