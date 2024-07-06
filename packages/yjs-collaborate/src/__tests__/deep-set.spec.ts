import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs'
import { deepSet } from "../utils/deep-set.ts";

describe('deep-set', () => {
  it('simple', () => {
    const data = {
      a: {
        b: {
          c: 'test',
          d: [1, 2, 3, 4]
        }
      }
    }

    const doc = new Y.Doc()
    const yMap = doc.getMap('testMap')

    deepSet(yMap, [], data)
  })

  it('nest', () => {

  })
})