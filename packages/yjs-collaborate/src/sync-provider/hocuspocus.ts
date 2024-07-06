import { IYjsSyncProvider } from "./index.ts";
import { HocuspocusProvider, HocuspocusProviderConfiguration } from '@hocuspocus/provider'
import { YjsWorkbook } from "../model/workbook.ts";

export class HocuspocusSyncProvider extends HocuspocusProvider implements IYjsSyncProvider {
  constructor(configuration: HocuspocusProviderConfiguration) {
    super(configuration);
  }

  get workbook() {
    return this.document.get('workbook', YjsWorkbook)
  }

  override emit(event: string, ...args) {
    return super.emit(event, ...args);
  }
}