import { test, expect } from "vitest";

interface IBlock {
  id: string;
  type: string;
  target: HTMLDivElement | null;
  next: IBlock | null;
  prev: IBlock | null;
}

class InlineBlock implements IBlock {
  id = crypto.randomUUID();
  constructor(
    public type: string,
    public target: HTMLDivElement | null,
    public next: IBlock | null,
    public prev: IBlock | null,
  ) {}
}

class LineBlock implements IBlock {
  id = crypto.randomUUID();
  type = "block";
  children = createBlockList<LineBlock>();
  inlineChildren = createBlockList<InlineBlock>();
  constructor(
    public target: HTMLDivElement | null,
    public next: LineBlock | null,
    public prev: LineBlock | null,
  ) {}
}

interface BlockList<Block extends IBlock> {
  _root: Block | null;
  _tail: Block | null;
  addBlockToEnd(block: Block): Block;
  addBlockToStart(block: Block): Block;
  insertBlockAfter(block: Block, newBlock: Block): Block;
  insertBlockBefore(block: Block, newBlock: Block): Block;
  deleteBlock(block: Block): Block;
  [Symbol.iterator](): Generator<Block, void, unknown>;
}

function assert(value: boolean, message?: string): asserts value {
  if (!value) throw new Error(message);
}

function createBlockList<Block extends IBlock>() {
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
      return block;
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
      return block;
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
      return block;
    },
  };

  return blocks;
}

function createEditor() {
  return { blocks: createBlockList<LineBlock>() };
}

test("editor be able to add new item to the end of the list", () => {
  const editor = createEditor();
  const newBlock = new LineBlock(null, null, null);
  editor.blocks.addBlockToEnd(newBlock);
  let blockArr = Array.from(editor.blocks);
  let firstBlock = blockArr[0];
  let lastBlock = blockArr.at(-1);

  expect(blockArr.length).toBe(1);
  expect(lastBlock).toBe(newBlock);
  expect(lastBlock).toBe(firstBlock);

  const newBlock2 = new LineBlock(null, null, null);
  editor.blocks.addBlockToEnd(newBlock2);
  blockArr = Array.from(editor.blocks);
  lastBlock = blockArr.at(-1);
  expect(blockArr.length).toBe(2);
  expect(lastBlock).toBe(newBlock2);

  firstBlock = blockArr[0];
  expect(firstBlock.next).toBe(newBlock2);
  expect(newBlock2.prev).toBe(firstBlock);
});

test("editor be able to add new item to the start of the list", () => {
  const editor = createEditor();
  const newBlock = new LineBlock(null, null, null);
  editor.blocks.addBlockToStart(newBlock);
  let blockArr = Array.from(editor.blocks);
  let firstBlock = blockArr[0];
  let lastBlock = blockArr.at(-1);

  expect(blockArr.length).toBe(1);
  expect(firstBlock).toBe(newBlock);
  expect(firstBlock).toBe(lastBlock);

  const newBlock2 = new LineBlock(null, null, null);
  editor.blocks.addBlockToStart(newBlock2);
  blockArr = Array.from(editor.blocks);
  firstBlock = blockArr[0];
  expect(blockArr.length).toBe(2);
  expect(firstBlock).toBe(newBlock2);

  lastBlock = blockArr.at(-1);
  expect(newBlock2.next).toBe(lastBlock);
  expect(lastBlock?.prev).toBe(newBlock2);
});

test("editor be able to add new block as 'next' LineBlock for a block", () => {
  const editor = createEditor();
  const newBlock = new LineBlock(null, null, null);
  editor.blocks.addBlockToStart(newBlock);

  const newBlock2 = new LineBlock(null, null, null);
  editor.blocks.insertBlockAfter(newBlock, newBlock2);
  const blockArr = Array.from(editor.blocks);
  const lastBlock = blockArr.at(-1);
  expect(blockArr.length).toBe(2);
  expect(lastBlock).toBe(newBlock2);

  const firstBlock = blockArr[0];
  expect(firstBlock.next).toBe(newBlock2);
  expect(newBlock2.prev).toBe(firstBlock);
});

test("editor be able to delete a block", () => {
  const editor = createEditor();
  const newBlock = new LineBlock(null, null, null);
  editor.blocks.addBlockToStart(newBlock);
  let blockArr = Array.from(editor.blocks);
  expect(blockArr.length).toBe(1);

  editor.blocks.deleteBlock(newBlock);
  blockArr = Array.from(editor.blocks);
  expect(blockArr.length).toBe(0);
});

test("move a block as the child of another block", () => {
  const editor = createEditor();
  const newBlock = new LineBlock(null, null, null);
  editor.blocks.addBlockToStart(newBlock);
  const newBlock2 = new LineBlock(null, null, null);
  editor.blocks.addBlockToEnd(newBlock2);
  expect(Array.from(editor.blocks).length).toBe(2);

  const block2 = editor.blocks.deleteBlock(newBlock2);
  expect(Array.from(editor.blocks).length).toBe(1);

  newBlock.children.addBlockToStart(block2);
  expect(Array.from(newBlock.children)[0]).toBe(block2);
});
