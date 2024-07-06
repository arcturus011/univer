export interface IEventEmitter {
  on: EventEmitter['on']
  off: EventEmitter['off']
  emit: EventEmitter['emit']
}

export default class EventEmitter {

  public callbacks: { [key: string]: Function[] } = {}

  public on(event: string, fn: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }

    this.callbacks[event].push(fn)

    // return this
  }

  public emit(event: string, ...args: any) {
    const callbacks = this.callbacks[event]

    if (callbacks) {
      callbacks.forEach(callback => callback.apply(this, args))
    }

    // return this
  }

  public off(event: string, fn?: Function) {
    const callbacks = this.callbacks[event]

    if (callbacks) {
      if (fn) {
        this.callbacks[event] = callbacks.filter(callback => callback !== fn)
      } else {
        delete this.callbacks[event]
      }
    }

    // return this
  }

  removeAllListeners(): void {
    this.callbacks = {}
  }
}
