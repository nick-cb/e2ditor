"use client";

import { assert } from "@/lib/utils";

export interface IBlock {
  id: string;
  type: BlockType;
  target: Node | null;
  next: IBlock | null;
  prev: IBlock | null;
}

export class RootBlock {
  id = crypto.randomUUID();
  type: BlockType = "root";
  children = createBlockList<LineBlock>(this);
}

export class InlineOptionBlock implements IBlock {
  id = crypto.randomUUID();
  type: "inline-option" = "inline-option";
  target: Node | null = null;
  inlineChildren: BlockList<OptionBlock> = createBlockList<OptionBlock>(this);

  constructor(
    public parent: LineBlock | RootBlock,
    public next: IBlock | null = null,
    public prev: IBlock | null = null,
  ) {}
}

export class OptionBlock implements IBlock {
  id: string = crypto.randomUUID();
  type: BlockType = "option";
  target: Node | null = null;
  content: string | null = null;

  constructor(
    public parent: InlineOptionBlock,
    public next: IBlock | null = null,
    public prev: IBlock | null = null,
  ) {}
}

export class LineBlock implements IBlock {
  id = crypto.randomUUID();
  type: BlockType = "block";
  children: BlockList<LineBlock> = createBlockList<LineBlock>(this);
  inlineChildren = createBlockList<InlineOptionBlock>(this);
  #target: HTMLDivElement | null = null;
  html: string | null = null;

  get target() {
    return this.#target;
  }

  set target(value) {
    this.#target = value;
    const observer = new MutationObserver((entries) => {
      this.html = this.#target?.innerHTML ?? null;
    });
    if (this.#target)
      observer.observe(this.#target, { characterData: true, subtree: true, childList: true });
  }

  constructor(
    target: HTMLDivElement | null = null,
    public next: LineBlock | null = null,
    public prev: LineBlock | null = null,
    public parent: LineBlock | RootBlock,
  ) {
    this.#target = target;
  }
}

type BlockListEvents =
  | "add-block-to-end"
  | "add-block-to-start"
  | "insert-block-after"
  | "insert-block-before"
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
  createBlock(): LineBlock;
  on(event: BlockListEvents, callback: (event: Event) => void): void;
  [Symbol.iterator](): Generator<Block, void, unknown>;
}

type BlockType = "root" | "block" | "inline-option" | "text" | "option";

export function createBlockList<Block extends IBlock>(parent?: RootBlock | IBlock) {
  const eventTarget = new EventTarget();
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
        block.next = null;
        block.prev = null;
      } else {
        assert(block !== this._tail, "cannot be the same tail block");
        assert(!!this._tail, "no tail block");
        block.prev = this._tail;
        block.next = null;
        this._tail.next = block;
        this._tail = block;
      }
      this._tail = block;
      if ("parent" in block) block.parent = parent;
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
      if ("parent" in block) block.parent = parent;
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
      if ("parent" in newBlock) newBlock.parent = parent;

      const event = new CustomEvent("insert-block-after", { detail: block });
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
      if ("parent" in newBlock) newBlock.parent = parent;

      const event = new CustomEvent("insert-block-before", { detail: block });
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
    createBlock() {
      const block = new LineBlock(null, null, null, parent as any);
      const event = new CustomEvent("create-block", { detail: block });
      eventTarget.dispatchEvent(event);
      return block;
    },
    on(event, callback) {
      eventTarget.addEventListener(event, callback);
    },
  };

  return blocks;
}

function isBlock(type: BlockType): type is "block" {
  return type === "block";
}
