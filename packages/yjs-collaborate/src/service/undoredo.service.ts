import * as Y from 'yjs'
import {
  CommandType,
  Disposable,
  DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY,
  DOCS_NORMAL_EDITOR_UNIT_ID_KEY,
  EDITOR_ACTIVATED,
  // FOCUSING_FORMULA_EDITOR,
  FOCUSING_SHEET, ICommand,
  ICommandService,
  IContextService, IUndoRedoItem, IUndoRedoService, IUndoRedoStatus,
  IUniverInstanceService, RedoCommandId, sequenceExecute,
  toDisposable, UndoCommandId, LocalUndoRedoService
} from "@univerjs/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Nullable } from "@univerjs/core";
import { IAccessor, IDisposable } from "@univerjs/core";

enum BatchingStatus {
  WAITING,
  CREATED,
}
const STACK_CAPACITY = 20;

abstract class MultiImplementationCommand implements IDisposable {
  dispose(): void {
    // empty
  }

  async dispatchToHandlers(): Promise<boolean> {
    return false;
  }
}

export const UndoCommand = new (class extends MultiImplementationCommand implements ICommand {
  readonly type = CommandType.COMMAND;

  readonly id = UndoCommandId;

  async handler(accessor: IAccessor) {
    const undoRedoService = accessor.get(IUndoRedoService);
    const element = undoRedoService.pitchTopUndoElement();

    if (!element) {
      return false;
    }

    // console.log('UndoManager', accessor.get(Y.UndoManager))
    const undoManager = accessor.get(Y.UndoManager)
    undoManager.undo()
    return true
    const commandService = accessor.get(ICommandService);
    const result = sequenceExecute(element.undoMutations, commandService);
    if (result) {
      undoRedoService.popUndoToRedo();

      return true;
    }

    return false;
  }
})();

export const RedoCommand = new (class extends MultiImplementationCommand implements ICommand {
  readonly type = CommandType.COMMAND;

  readonly id = RedoCommandId;

  async handler(accessor: IAccessor) {
    const undoRedoService = accessor.get(IUndoRedoService);
    const element = undoRedoService.pitchTopRedoElement();
    if (!element) {
      return false;
    }

    // console.log('UndoManager', accessor.get(Y.UndoManager))
    const undoManager = accessor.get(Y.UndoManager)
    undoManager.redo()
    return true
    const commandService = accessor.get(ICommandService);
    const result = sequenceExecute(element.redoMutations, commandService);
    if (result) {
      undoRedoService.popRedoToUndo();

      return true;
    }

    return false;
  }
})();

export class YjsUndoRedoService extends Disposable implements IUndoRedoService {
  readonly undoRedoStatus$: Observable<IUndoRedoStatus>;
  protected readonly _undoRedoStatus$ = new BehaviorSubject<{ undos: number; redos: number }>({ undos: 0, redos: 0 });

  // Undo and redo stacks are per unit.
  protected readonly _undoStacks = new Map<string, IUndoRedoItem[]>();
  protected readonly _redoStacks = new Map<string, IUndoRedoItem[]>();

  private _batchingStatus = new Map<string, BatchingStatus>();

  constructor(
    @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
    @ICommandService protected readonly _commandService: ICommandService,
    @IContextService private readonly _contextService: IContextService
  ) {
    super();

    this.undoRedoStatus$ = this._undoRedoStatus$.asObservable();

    this.disposeWithMe(this._commandService.registerCommand(UndoCommand));
    this.disposeWithMe(this._commandService.registerCommand(RedoCommand));

    this.disposeWithMe(toDisposable(() => this._undoRedoStatus$.complete()));
    this.disposeWithMe(toDisposable(this._univerInstanceService.focused$.subscribe(() => this._updateStatus())));
  }

  pushUndoRedo(item: IUndoRedoItem): void {
    const { unitID } = item;

    const redoStack = this._getRedoStack(unitID, true);
    const undoStack = this._getUndoStack(unitID, true);

    // redo stack should be cleared when pushing an undo
    redoStack.length = 0;

    // should try to append first and then
    if (this._batchingStatus.has(item.unitID)) {
      const batchingStatus = this._batchingStatus.get(item.unitID)!;
      const lastItem = this._pitchUndoElement(item.unitID);
      if (batchingStatus === BatchingStatus.WAITING || !lastItem) {
        appendNewItem(item);
        this._batchingStatus.set(item.unitID, BatchingStatus.CREATED);
      } else {
        this._tryBatchingElements(lastItem, item);
      }
    } else {
      appendNewItem(item);
    }

    function appendNewItem(item: IUndoRedoItem) {
      undoStack.push(item);
      if (undoStack.length > STACK_CAPACITY) {
        undoStack.splice(0, 1);
      }
    }

    this._updateStatus();
  }

  clearUndoRedo(unitID: string): void {
    const redoStack = this._getRedoStack(unitID);
    if (redoStack) {
      redoStack.length = 0;
    }

    const undoStack = this._getUndoStack(unitID);
    if (undoStack) {
      undoStack.length = 0;
    }

    this._updateStatus();
  }

  pitchTopUndoElement(): Nullable<IUndoRedoItem> {
    const unitID = this._getFocusedUnitId();
    return this._pitchUndoElement(unitID);
  }

  pitchTopRedoElement(): Nullable<IUndoRedoItem> {
    const unitID = this._getFocusedUnitId();
    return this._pitchRedoElement(unitID);
  }

  private _pitchUndoElement(unitId: string): Nullable<IUndoRedoItem> {
    const stack = this._getUndoStack(unitId);
    return stack?.length ? stack[stack.length - 1] : null;
  }

  private _pitchRedoElement(unitId: string): Nullable<IUndoRedoItem> {
    const stack = this._getRedoStack(unitId);
    return stack?.length ? stack[stack.length - 1] : null;
  }

  popUndoToRedo(): void {
    const undoStack = this._getUndoStackForFocused();
    const element = undoStack.pop();
    if (element) {
      const redoStack = this._getRedoStackForFocused();
      redoStack.push(element);
      this._updateStatus();
    }
  }

  popRedoToUndo(): void {
    const redoStack = this._getRedoStackForFocused();
    const element = redoStack.pop();
    if (element) {
      const undoStack = this._getUndoStackForFocused();
      undoStack.push(element);
      this._updateStatus();
    }
  }

  __tempBatchingUndoRedo(unitId: string): IDisposable {
    if (this._batchingStatus.has(unitId)) {
      throw new Error('[LocalUndoRedoService]: cannot batching undo redo twice at the same time!');
    }

    this._batchingStatus.set(unitId, BatchingStatus.WAITING);
    return toDisposable(() => this._batchingStatus.delete(unitId));
  }

  protected _updateStatus(): void {
    const unitID = this._getFocusedUnitId();
    const undos = (unitID && this._undoStacks.get(unitID)?.length) || 0;
    const redos = (unitID && this._redoStacks.get(unitID)?.length) || 0;

    this._undoRedoStatus$.next({
      undos,
      redos,
    });
  }

  protected _getUndoStack(unitId: string): IUndoRedoItem[] | null;
  protected _getUndoStack(unitId: string, createAsNeeded: true): IUndoRedoItem[];
  protected _getUndoStack(unitId: string, createAsNeeded = false): IUndoRedoItem[] | null {
    let stack = this._undoStacks.get(unitId);
    if (!stack && createAsNeeded) {
      stack = [];
      this._undoStacks.set(unitId, stack);
    }

    return stack || null;
  }

  protected _getRedoStack(unitId: string): IUndoRedoItem[] | null;
  protected _getRedoStack(unitId: string, createAsNeeded: true): IUndoRedoItem[];
  protected _getRedoStack(unitId: string, createAsNeeded = false): IUndoRedoItem[] | null {
    let stack = this._redoStacks.get(unitId);
    if (!stack && createAsNeeded) {
      stack = [];
      this._redoStacks.set(unitId, stack);
    }

    return stack || null;
  }

  protected _getUndoStackForFocused(): IUndoRedoItem[] {
    const unitID = this._getFocusedUnitId();

    if (!unitID) {
      throw new Error('No focused univer instance!');
    }

    return this._getUndoStack(unitID, true);
  }

  protected _getRedoStackForFocused(): IUndoRedoItem[] {
    const unitID = this._getFocusedUnitId();

    if (!unitID) {
      throw new Error('No focused univer instance!');
    }

    return this._getRedoStack(unitID, true);
  }

  private _tryBatchingElements(item: IUndoRedoItem, newItem: IUndoRedoItem): void {
    // this could be not that easy in other sitatuations than Find & Replace
    item.redoMutations.push(...newItem.redoMutations);
    item.undoMutations.push(...newItem.undoMutations);
  }

  private _getFocusedUnitId() {
    return '';
    let unitID: string = '';

    const isFocusSheet = this._contextService.getContextValue(FOCUSING_SHEET);
    const isFocusFormulaEditor = this._contextService.getContextValue(FOCUSING_FORMULA_EDITOR);
    const isFocusEditor = this._contextService.getContextValue(EDITOR_ACTIVATED);

    if (isFocusSheet) {
      if (isFocusFormulaEditor) {
        unitID = DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY;
      } else if (isFocusEditor) {
        unitID = DOCS_NORMAL_EDITOR_UNIT_ID_KEY;
      } else {
        unitID = this._univerInstanceService.getFocusedUnit()?.getUnitId() ?? '';
      }
    } else {
      unitID = this._univerInstanceService.getFocusedUnit()?.getUnitId() ?? '';
    }

    return unitID;
  }
}
