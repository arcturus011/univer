import { ICellData, Inject, Injector, IWorkbookData } from "@univerjs/core";
import { PropertyTransformer, TransformerBase } from "../workbook";
import { CellMatrixTransformer } from "../cell-matrix";
import * as Y from "yjs";

export class CellDataTransformer extends TransformerBase implements PropertyTransformer<ICellData, 'v' | 't'> {
  parent: CellMatrixTransformer;
  private snapshot: ICellData;

  constructor(
    @Inject(Injector) readonly injector: Injector,
  ) {
    super();
  }

  /**
   * CellData 更新处理逻辑
   * @param parent
   * @param evt
   * @param snapshot
   * @description 如果走
   */
  override handler(parent: CellMatrixTransformer, evt: Y.YEvent<any>, snapshot: ICellData): any {
    this.parent = parent
    this.evt = evt
    this.snapshot = snapshot

    const remainPath = this.evt.path.slice(5)

    switch (remainPath[0]) {
      default:
        this.default(remainPath[0] as string)
    }
  }

  protected override default(key: string): any {
    // TODO 应该尽可能和 setRangeValues 一致
    this.snapshot[key] = ''
  }

  v() {

  }

  t() {

  }
}
