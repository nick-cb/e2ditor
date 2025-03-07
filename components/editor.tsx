"use client";

import React, { useState } from "react";
import { assert, isLineBlock } from "@/lib/utils";
import { IBlock, LineBlock, RootBlock } from "./block";
import { CommandPrompt2 } from "@/components/command-prompt";
import { Block } from "@/components/editor-block";
import { useEditor } from "@/components/useEditor";

export function Editor() {
  const editor = useEditor();

  return (
    <div className={"h-full"}>
      <div
        contentEditable={true}
        suppressContentEditableWarning
        onMouseDown={(event) => {
          if (event.currentTarget !== event.target) return;
          const block = editor.blocks.children.createBlock("block");
          const lastBlock = editor.blocks.children.getLastBlock();
          if (!lastBlock || (lastBlock.target && !!lastBlock.target.textContent)) {
            editor.blocks.children.addBlockToEnd(block);
            assert(!!block.target, "no dom node: " + block.id);
            editor.changeCurrentBlock(block);
            return;
          }
          assert(!!lastBlock.target, "no dom node: " + lastBlock.id);
          editor.changeCurrentBlock(lastBlock);
        }}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          const block = editor.currentBlock;
          if (!block || !isLineBlock(block)) {
            event.preventDefault();
            return;
          }
          if (!event.shiftKey && key === "enter") {
            event.preventDefault();
            if (editor.commandPromptState.open) {
              const inlineOption = editor.insertInlineOption(block);
              editor.closeCommandPrompt();
              editor.moveCaretTo(Array.from(inlineOption.inlineChildren)[0]);
              return;
            }
            const parent = block.parent;
            const newBlock = parent.children.insertBlockAfter(
              block,
              parent.children.createBlock("block"),
            );
            assert(!!newBlock.target, "no dom node: " + newBlock.id);
            editor.changeCurrentBlock(newBlock);
            return;
          }
          if (!event.shiftKey && key === "tab") {
            event.preventDefault();
            const prev = block.prev;
            if (!prev) return;
            const parent = block.parent;
            assert(!!block.target, "no dom node: " + block.id);
            parent.children.deleteBlock(block);
            prev.children.addBlockToEnd(block);
            assert(!!block.target, "no dom node: " + block.id);
            editor.changeCurrentBlock(block);
            return;
          }
          if (event.shiftKey && key === "tab") {
            event.preventDefault();
            if (block.parent instanceof RootBlock) return;
            let nextBlock = block.next;
            while (nextBlock) {
              block.parent.children.deleteBlock(nextBlock);
              block.children.addBlockToEnd(nextBlock);
              nextBlock = nextBlock.next;
            }
            assert(!!block.target, "no dom node: " + block.id);
            block.parent.children.deleteBlock(block);
            const grandParent = block.parent.parent;
            grandParent.children.insertBlockAfter(block.parent, block);
            assert(!!block.target, "no dom node: " + block.id);
            editor.changeCurrentBlock(block);
            return;
          }
          if (key === "/") {
            event.preventDefault();
            const span = document.createElement("span");
            span.textContent = "/";
            assert(!!block.target, "no dom node: " + block.id);
            block.target.append(span);
            editor.openCommandPrompt(block, span);
          }
          if (key === "backspace") {
            // event.preventDefault();
            // block.parent.children.deleteBlock(block);
            assert(!!block.target, "no dom node: " + block.id);
            const position = editor.getBlockCaretPosition(block);
            if (position !== 0) return;

            if (block === block.parent.children._tail && isLineBlock(block.parent)) {
              block.parent.children.deleteBlock(block);
              const grandparent = block.parent.parent;
              block.parent.children.deleteBlock(block);
              grandparent.children.insertBlockAfter(block.parent, block);
              editor.changeCurrentBlock(block);
              return;
            }
            let nextBlock: LineBlock | null = null;
            if (block.prev && Array.from(block.prev.children).length) {
              let tail = block.prev.children._tail;
              while (tail && Array.from(tail.children).length) {
                tail = tail.children._tail;
              }
              if (tail) nextBlock = tail;
            } else if (block.prev) {
              nextBlock = block.prev;
            } else if (isLineBlock(block.parent)) {
              nextBlock = block.parent;
            }
            if (!nextBlock) return;
            for (const child of block.inlineChildren) {
              block.inlineChildren.deleteBlock(child);
              nextBlock.inlineChildren.addBlockToEnd(child);
            }
            for (const child of block.children) {
              block.children.deleteBlock(child);
              nextBlock.parent.children.insertBlockAfter(block, child);
            }
            block.parent.children.deleteBlock(block);
            assert(!!nextBlock.target, "no dom node: " + nextBlock.id);
            nextBlock.target.focus();
            editor.changeCurrentBlock(block);
          }
          editor.resetIntentCaret();
        }}
        // onKeyUp={(event) => event.stopPropagation()}
        className={"min-h-full cursor-text"}
      >
        {Array.from(editor.blocks.children).map((block) => {
          return <Block key={block.id} editor={editor} block={block as LineBlock} />;
        })}
        {/* <CommandPrompt editor={editor} /> */}
      </div>
      <CommandPrompt2 editor={editor} />
    </div>
  );
}

export function EditorTitle() {
  return <div>Untitled Test</div>;
}

export type CommandPromptState = {
  block: IBlock | null;
  anchor: HTMLElement | null;
  open: boolean;
  top: number;
  left: number;
};

// function isInlineOption(block: IBlock): block is InlineBlock {
//   return block.type === "inline-option";
// }

// function isBlock(block: any): block is IBlock {
//   return isLineBlock(block) || isInlineOption(block);
// }
