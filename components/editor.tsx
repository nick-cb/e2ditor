"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { assert, isLineBlock, useComposedRefs } from "@/lib/utils";
import { IBlock, LineBlock, RootBlock } from "./block";
import { CommandPrompt2 } from "@/components/command-prompt";
import { Block } from "@/components/editor-block";
import { useEditor } from "@/components/useEditor";

export function Editor() {
  const editor = useEditor();

  return (
    <div className={"h-full"}>
      <div
        ref={editor.editorContainerRef}
        contentEditable={true}
        suppressContentEditableWarning
        onMouseDown={(event) => {
          if (event.currentTarget !== event.target) return;
          const block = editor.blocks.children.createBlock();
          const lastBlock = editor.blocks.children.getLastBlock();
          if (!lastBlock || (lastBlock.target && !!lastBlock.target.textContent)) {
            editor.blocks.children.addBlockToEnd(block);
            assert(!!block.target, "no dom node: " + block.id);
            return;
          }
          assert(!!lastBlock.target, "no dom node: " + lastBlock.id);
        }}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          const block = editor.getCurrentBlock();
          // if (block) {
          //   console.log({ block }, editor.getLineBlockParent(block));
          // }
          if (block && isLineBlock(block)) {
            if (!event.shiftKey && key === "enter") {
              event.preventDefault();
              // if (editor.commandPromptState.open) {
              //   const inlineOption = editor.insertInlineOption(block);
              //   editor.closeCommandPrompt();
              //   editor.moveCaretTo(Array.from(inlineOption.inlineChildren)[0]);
              //   return;
              // }
              const parent = block.parent;
              const newBlock = parent.children.insertBlockAfter(
                block,
                parent.children.createBlock(),
              );
              assert(!!newBlock.target, "no dom node: " + newBlock.id);
              editor.moveCaretTo(newBlock);
              return;
            }
            if (!event.shiftKey && key === "tab") {
              event.preventDefault();
              const prev = block.prev;
              if (!prev) return;
              const parent = block.parent;
              assert(!!block.target, "no dom node: " + block.id);
              const caretPos = editor.getBlockCaretPosition(block);
              parent.children.deleteBlock(block);
              prev.children.addBlockToEnd(block);
              assert(!!block.target, "no dom node: " + block.id);
              editor.moveCaretTo(block, caretPos);
              return;
            }
            if (event.shiftKey && key === "tab") {
              event.preventDefault();
              if (block.parent instanceof RootBlock) return;
              const caretPos = editor.getBlockCaretPosition(block);
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
              editor.moveCaretTo(block, caretPos);
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
            return;
          }
        }}
        onCut={(event) => {
          event.preventDefault();
          const selection = document.getSelection();
          assert(!!selection);
          // 1. Find all the line block that is being select
          // 2. For each line block, check if there is special node being select (options)
          // 2.1. For each special node being select, check if it select the whole node or just part of the node
          // 2.2. If select the whole node, remove the special node from the data structure
          // 2.3. If select part of the node, don't remove the special node from data structure
          // 2.4. For any case above, set the clip board to a representation of the data stucture in pure text
          // console.log({ selection });
          editor.cut();
        }}
        className={"min-h-full cursor-text"}
      >
        {Array.from(editor.blocks.children).map((block) => {
          return <Block key={block.id} editor={editor} block={block as LineBlock} />;
        })}
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
