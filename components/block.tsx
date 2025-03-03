import { assert } from "@/lib/utils";

export interface IBlock {
  id: string;
  type: string;
  target: Node | null;
  next: IBlock | null;
  prev: IBlock | null;
}

export class RootBlock {
  id = crypto.randomUUID();
  type = "root";
  children = createBlockList<LineBlock>(this);
}

export class InlineBlock implements IBlock {
  id = crypto.randomUUID();
  constructor(
    public type: string,
    public parent: LineBlock | RootBlock,
    public target: Node | null = null,
    public next: IBlock | null = null,
    public prev: IBlock | null = null,
  ) {}
}

export class InlineOptionBlock implements IBlock {
  id = crypto.randomUUID();
  type: string = "inline-option";
  target: Node | null = null;
  inlineChildren = createBlockList<InlineBlock>(this);

  constructor(
    public parent: LineBlock | RootBlock,
    public next: IBlock | null = null,
    public prev: IBlock | null = null,
  ) {}
}

export class TextBlock extends InlineBlock {
  content: string | null = null;
  constructor(
    public parent: LineBlock | RootBlock,
    public target: Node | null = null,
    public next: IBlock | null = null,
    public prev: IBlock | null = null,
  ) {
    super("text", parent, target, next, prev);
  }
}

export class LineBlock implements IBlock {
  id = crypto.randomUUID();
  type = "block";
  children: BlockList<LineBlock> = createBlockList<LineBlock>(this);
  inlineChildren = createBlockList<InlineBlock>(this);
  #target: HTMLDivElement | null = null;
  #observer = new MutationObserver((entries) => {
    for (const entry of entries) {
      if (entry.type === "childList") {
        if (entry.addedNodes.length) {
          for (const addedNode of entry.addedNodes) {
            if (addedNode.nodeType === 3) {
              const newTextBlock = this.inlineChildren.createBlock("text");
              newTextBlock.target = entry.target;
              this.inlineChildren.addBlockToEnd(newTextBlock);
            }
          }
        }

        if (entry.removedNodes.length) {
          for (const removedNode of entry.removedNodes) {
            for (const child of this.inlineChildren) {
              if (removedNode === child.target) {
                this.inlineChildren.deleteBlock(child);
              }
            }
          }
        }
      }
    }
  });

  get target() {
    return this.#target;
  }

  set target(value) {
    this.#target = value;
    if (this.#target) {
      this.#observer.observe(this.#target, { childList: true, subtree: true });
    }
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
  createBlock<T extends BlockType>(type: T): CreateBlockReturns<T>;
  on(event: BlockListEvents, callback: (event: Event) => void): void;
  [Symbol.iterator](): Generator<Block, void, unknown>;
}

type BlockType = "block" | "inline-option" | "text";
type CreateBlockReturns<T extends BlockType> =
  T extends "block" ? LineBlock
  : T extends "text" ? TextBlock
  : T extends "inline-option" ? InlineOptionBlock
  : InlineBlock;

export function createBlockList<Block extends IBlock>(parent?: RootBlock | LineBlock) {
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
        console.log("d");
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
    createBlock(type) {
      if (type === "block" && parent) {
        const block = new LineBlock(null, null, null, parent);
        const event = new CustomEvent("create-block", { detail: block });
        eventTarget.dispatchEvent(event);
        return block;
      }
      if (type === "text" && parent) {
        const block = new TextBlock(parent);
        return block;
      }
      if (type === "inline-option" && parent) {
        const block = new InlineOptionBlock(parent, null, null);
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
