import { assert } from "@/lib/utils";

export interface IBlock {
  id: string;
  type: string;
  target: HTMLDivElement | null;
  next: IBlock | null;
  prev: IBlock | null;
  parent: IBlock;
}

// export interface IRootBlock {
//   id: string;
//   type: string;
//   children: BlockList<LineBlock>;
// }

export class RootBlock {
  id = crypto.randomUUID();
  type = "root";
  children = createBlockList<LineBlock>();
}

export class InlineBlock implements IBlock {
  id = crypto.randomUUID();
  constructor(
    public type: string,
    public target: HTMLDivElement | null,
    public next: IBlock | null,
    public prev: IBlock | null,
    public parent: LineBlock,
  ) {}
}

export class LineBlock implements IBlock {
  id = crypto.randomUUID();
  type = "block";
  children = createBlockList<LineBlock>();
  inlineChildren = createBlockList<InlineBlock>();
  constructor(
    public target: HTMLDivElement | null = null,
    public next: LineBlock | null = null,
    public prev: LineBlock | null = null,
    public parent: IBlock,
  ) {}
}

type BlockListEvents =
  | "add-block-to-end"
  | "add-block-to-start"
  | "add-block-to-after"
  | "add-block-to-before"
  | "delete-block"
  | "create-block";
export interface BlockList<Block extends IBlock> {
  _root: Block | null;
  _tail: Block | null;
  addBlockToEnd(block: Block): Block;
  addBlockToStart(block: Block): Block;
  insertBlockAfter(block: Block, newBlock: Block): Block;
  insertBlockBefore(block: Block, newBlock: Block): Block;
  deleteBlock(block: Block): Block;
  getLastBlock(): Block | null;
  createBlock(type: "block" | "inline-option"): LineBlock;
  on(event: BlockListEvents, callback: (event: Event) => void): void;
  [Symbol.iterator](): Generator<Block, void, unknown>;
}

export function createBlockList<Block extends IBlock>(parent?: RootBlock) {
  const eventTarget = new EventTarget();
  // const events = {
  //   "add-block-to-start": new CustomEvent("add-block-to-start"),
  //   "add-block-to-end": new CustomEvent("add-block-to-end"),
  //   "add-block-to-after": new CustomEvent("add-block-to-after"),
  //   "add-block-to-before": new CustomEvent("add-block-to-before"),
  //   "delete-block": new CustomEvent("delete-block"),
  //   "create-block": new CustomEvent("create-block"),
  // };
  const blocks: BlockList<Block> = {
    _root: null,
    _tail: null,
    *[Symbol.iterator]() {
      let block = this._root;
      while (block) {
        yield block;
        // @ts-ignore@ts-ignore
        block = block.next;
      }
    },
    addBlockToEnd(block) {
      if (!this._root) {
        this._root = block;
        this._tail = block;
      } else {
        assert(block !== this._tail, "cannot be the same tail block");
        assert(!!this._tail, "no tail block");
        block.prev = this._tail;
        this._tail.next = block;
        this._tail = block;
      }
      this._tail = block;
      if (!block.parent && block !== this._root) {
        block.parent = this._root;
      }
      const event = new CustomEvent("add-block-to-end", { detail: block });
      eventTarget.dispatchEvent(event);
      return block;
    },
    addBlockToStart(block) {
      if (!this._tail) this._tail = block;
      if (!this._root) {
        this._root = block;
        this._tail = block;
      } else {
        assert(block !== this._root, "cannot be the same tail block");
        block.next = this._root;
        this._root.prev = block;
        this._root = block;
      }
      if (!block.parent && block !== this._root) {
        block.parent = this._root;
      }
      const event = new CustomEvent("add-block-to-start", { detail: block });
      eventTarget.dispatchEvent(event);
      return block;
    },
    insertBlockAfter(block, newBlock) {
      assert(block !== newBlock, "cannot be the same block");
      const next = block.next;
      if (next) next.prev = newBlock;
      if (block === this._tail) this._tail = newBlock;
      block.next = newBlock;
      newBlock.next = next;
      newBlock.prev = block;

      const event = new CustomEvent("add-block-to-after", { detail: block });
      eventTarget.dispatchEvent(event);
      return newBlock;
    },
    insertBlockBefore(block, newBlock) {
      assert(block !== newBlock, "cannot be the same block");
      if (block === newBlock) return block;
      let prev = block.prev;
      if (!prev) prev = this._root;
      assert(!!prev, "no prev block");
      prev.next = newBlock;
      newBlock.next = block;
      block.prev = newBlock;

      const event = new CustomEvent("add-block-to-before", { detail: block });
      eventTarget.dispatchEvent(event);
      return newBlock;
    },
    deleteBlock(block) {
      const prev = block.prev;
      const next = block.next;
      if (prev) prev.next = next;
      if (next) next.prev = prev;
      // @ts-ignore@ts-ignore
      if (block === this._tail) this._tail = prev;
      // @ts-ignore@ts-ignore
      if (block === this._root) this._root = next;

      const event = new CustomEvent("delete-block", { detail: block });
      eventTarget.dispatchEvent(event);
      return block;
    },
    getLastBlock() {
      return this._tail;
    },
    createBlock(type) {
      if (type === "block") {
        const block = new LineBlock(null, null, null, this._root ?? parent);
        const event = new CustomEvent("create-block", { detail: block });
        eventTarget.dispatchEvent(event);
        return block;
      }
      throw new Error("invalid type");
    },
    on(event, callback) {
      eventTarget.addEventListener(event, callback);
    },
  };

  return blocks;
}
