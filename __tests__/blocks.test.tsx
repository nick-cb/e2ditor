import { BlockList, createBlockList, IBlock, LineBlock } from "@/components/block";
import { assert } from "@/lib/utils";
import { test, expect } from "vitest";

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

  newBlock.children.addBlockToEnd(block2);
  expect(Array.from(newBlock.children).length).toBe(1);
  expect(Array.from(newBlock.children)[0]).toBe(block2);
});
