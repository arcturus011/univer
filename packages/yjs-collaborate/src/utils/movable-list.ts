import * as Y from 'yjs'
import * as fractionalIndex from 'fractional-indexing'

export class MovableList<T> extends Y.Array<T> {
  orderMap = new Y.Map<number>()
  _len = 0

  override get length() {
    return this._len
  }

  override set length(length) {
    if (length > this._len) {

    } else if (length < this._len) {

    }
  }

  static override from(list: any[]) {
  }

  override clone() {

  }

  override insert() {

  }

  override push() {

  }

  override unshift() {

  }

  override delete() {

  }

  override toArray() {

  }

  override slice() {

  }

  override toJSON() {

  }

  override map() {

  }

  override forEach() {

  }

  move(from, to){

  }
}

export class MovableListItem {
  id: string
  value: any

  constructor(value: any) {
    this.id = ''
  }
}