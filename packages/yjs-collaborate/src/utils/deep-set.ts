import * as Y from 'yjs'

export function deepSet<T extends Y.Array<any> | Y.Map<any>>(root: T, path: Array<string | number | symbol>, value: any) {
  let target = root
  for (let i = 0; i < path.length - 1; i++) {
    if (target instanceof Y.Array) {
      target = target.get(path[i] as number)
    } else if (target instanceof Y.Map) {
      target = target.get(path[i] as string)
    } else {
      throw new Error('target 值非法')
    }
  }

  if (target instanceof Y.Array) {
    return deepSetYArray(target as Y.Array<any>, path[path.length - 1] as number, value)
  }

  if (target instanceof Y.Map) {
    return deepSetYMap(target as Y.Map<any>, path[path.length - 1] as string, value)
  }
}

export function deepSetYArray<T extends Y.Array<any>>(root: T, key: number, value: any) {
  if (root.get(key) instanceof Y.AbstractType && typeof value == 'object') {
    // 一般来说，Y.Array 下面都是 Y.Map，这样可以保持某个 item 的引用，获取其最新值
    Object.keys(value).forEach(valueKey => {
      deepSet(root.get(key), [valueKey], value[valueKey])
    })
  } else {
    // 如果一定要使用 primitive value ，那就执行删除再插入
    root.delete(key)
    root.insert(key, [value])
  }

}

export function deepSetYMap<T extends Y.Map<any>>(root: T, key: string, value: any) {
  if (root.get(key) instanceof Y.AbstractType && typeof value == 'object') {
    // 如果 value 是 AbstractType ，递归 set
    Object.keys(value).forEach(valueKey => {
      deepSet(root.get(key), [valueKey], value[valueKey])
    })
  } else {
    // simple set
    root.set(key, value)
  }
}