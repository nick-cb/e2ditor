import { BlockList, createBlockList, IBlock, LineBlock, RootBlock } from "@/components/block";
import { assert } from "@/lib/utils";
import { test, expect } from "vitest";

function createEditor() {
  return new RootBlock();
  {
    blocks: createBlockList<LineBlock>();
  }
}

test("editor be able to add new item to the end of the list", () => {
  const editor = createEditor();
  const newBlock = editor.children.createBlock("block");
  editor.children.addBlockToEnd(newBlock);
  let blockArr = Array.from(editor.children);
  let firstBlock = blockArr[0];
  let lastBlock = blockArr.at(-1);

  expect(blockArr.length).toBe(1);
  expect(lastBlock).toBe(newBlock);
  expect(lastBlock).toBe(firstBlock);

  const newBlock2 = editor.children.createBlock("block");
  editor.children.addBlockToEnd(newBlock2);
  blockArr = Array.from(editor.children);
  lastBlock = blockArr.at(-1);
  expect(blockArr.length).toBe(2);
  expect(lastBlock).toBe(newBlock2);

  firstBlock = blockArr[0];
  expect(firstBlock.next).toBe(newBlock2);
  expect(newBlock2.prev).toBe(firstBlock);

  checkLoop(editor);
});

test("editor be able to add new item to the start of the list", () => {
  const editor = createEditor();
  const newBlock = editor.children.createBlock("block");
  editor.children.addBlockToStart(newBlock);
  let blockArr = Array.from(editor.children);
  let firstBlock = blockArr[0];
  let lastBlock = blockArr.at(-1);

  expect(blockArr.length).toBe(1);
  expect(firstBlock).toBe(newBlock);
  expect(firstBlock).toBe(lastBlock);

  const newBlock2 = editor.children.createBlock("block");
  editor.children.addBlockToStart(newBlock2);
  blockArr = Array.from(editor.children);
  firstBlock = blockArr[0];
  expect(blockArr.length).toBe(2);
  expect(firstBlock).toBe(newBlock2);

  lastBlock = blockArr.at(-1);
  expect(newBlock2.next).toBe(lastBlock);
  expect(lastBlock?.prev).toBe(newBlock2);

  checkLoop(editor);
});

test("editor be able to add new block as 'next' LineBlock for a block", () => {
  const editor = createEditor();
  const newBlock = editor.children.createBlock("block");
  editor.children.addBlockToStart(newBlock);

  const newBlock2 = editor.children.createBlock("block");
  editor.children.insertBlockAfter(newBlock, newBlock2);
  const blockArr = Array.from(editor.children);
  const lastBlock = blockArr.at(-1);
  expect(blockArr.length).toBe(2);
  expect(lastBlock).toBe(newBlock2);

  const firstBlock = blockArr[0];
  expect(firstBlock.next).toBe(newBlock2);
  expect(newBlock2.prev).toBe(firstBlock);

  checkLoop(editor);
});

test("editor be able to delete a block", () => {
  const editor = createEditor();
  const newBlock = editor.children.createBlock("block");
  editor.children.addBlockToStart(newBlock);
  let blockArr = Array.from(editor.children);
  expect(blockArr.length).toBe(1);

  editor.children.deleteBlock(newBlock);
  blockArr = Array.from(editor.children);
  expect(blockArr.length).toBe(0);

  checkLoop(editor);
});

test("move a block as the child of another block", () => {
  const editor = createEditor();
  const newBlock = editor.children.createBlock("block");
  editor.children.addBlockToStart(newBlock);
  const newBlock2 = editor.children.createBlock("block");
  editor.children.addBlockToEnd(newBlock2);
  expect(Array.from(editor.children).length).toBe(2);

  const block2 = editor.children.deleteBlock(newBlock2);
  expect(Array.from(editor.children).length).toBe(1);

  newBlock.children.addBlockToEnd(block2);
  expect(Array.from(newBlock.children).length).toBe(1);
  expect(Array.from(newBlock.children)[0]).toBe(block2);

  checkLoop(editor);
});

function checkLoop(root: RootBlock) {
  const visited = new Map<string, number>();
  for (const child of root.children) {
    if (visited.get(child.id) === 1) throw new Error("Detected loop");
    else visited.set(child.id, 1);
  }
}
