import { IYjsSyncProvider } from "./sync-provider";
import { HocuspocusSyncProvider } from "./sync-provider/hocuspocus";
import { Univer, UniverInstanceType, Injector } from "@univerjs/core";

export { YjsPlugin } from './plugin.ts'

export function createSyncProvider(injector: Injector): IYjsSyncProvider {
  const provider = injector.createInstance(HocuspocusSyncProvider, {name: '123', url: 'ws://localhost:5000'});
  // univer.__getInjector().add([IYjsSyncProvider, {useValue: provider}])

  // const onSyncedCallback = () => {
  //   // univer.createUnit(UniverInstanceType.UNIVER_SHEET, provider.workbook.toWorkbook());
  //   provider.off('synced', onSyncedCallback)
  // }

  // provider.on('synced', onSyncedCallback)
  // provider.connect()
  return provider
}