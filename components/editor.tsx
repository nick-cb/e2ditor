"use client";

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { assert, isLineBlock } from "@/lib/utils";
import { BlockList, IBlock, LineBlock, RootBlock, TextBlock } from "./block";
import { CommandPrompt2 } from "@/components/command-prompt";
import { Block } from "@/components/editor-block";

export function Editor() {
  const editor = useEditor();
  const [selectStage, setSelectStage] = useState(0);

  return (
    <div className={"h-full"}>
      <div
        contentEditable={true}
        suppressContentEditableWarning
        onClick={(event) => {
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
          editor.changeCurrentBlock(block);
        }}
        // onKeyDown={(event) => {
        //   const key = event.key.toLowerCase();
        //   console.log({key});
        //   if (key === "enter") {
        //     console.log(event.preventDefault());
        //   }
        // }}
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
export function useEditor() {
  const [render, setRender] = useState(false);
  const blockRef = useRef(new RootBlock());
  const mapRef = useRef<Map<HTMLElement, IBlock>>(new Map());
  const intentCaret = useRef<number | undefined>(undefined);
  const [commandPromptState, setCommandPromptState] = useState<CommandPromptState>({
    block: null,
    anchor: null,
    open: false,
    left: 0,
    top: 0,
  });
  const [block, setBlock] = useState<LineBlock | null>(null);

  useEffect(() => {
    if (!blockRef.current) return;
    function attachEvent(children: BlockList<IBlock>) {
      const handler = (event: Event) => {
        flushSync(() => setRender((prev) => !prev));
      };
      children.on("delete-block", handler);
      children.on("add-block-to-end", handler);
      children.on("add-block-to-start", handler);
      children.on("insert-block-before", handler);
      children.on("insert-block-after", handler);
      children.on("create-block", (event) => {
        if ("detail" in event && event.detail instanceof LineBlock) {
          attachEvent(event.detail.children);
          attachEvent(event.detail.inlineChildren);
        }
      });
    }
    attachEvent(blockRef.current.children);
  }, [blockRef]);

  function registerBlock(block: IBlock) {
    return (current: HTMLDivElement) => {
      block.target = current;
      mapRef.current.set(current, block);
      return () => {
        block.target = current;
        mapRef.current.delete(current);
      };
    };
  }

  function rerender() {
    flushSync(() => setRender((prev) => !prev));
  }

  function a(node: Node, startOffSet: number, log: boolean): any[] {
    let result = [];
    for (const childNode of node.childNodes) {
      if (log) {
        console.log({ startOffSet, childNode, len: childNode.textContent?.length });
      }
      const children = [];
      if (childNode.nodeType === 3) {
        children.push([
          childNode,
          startOffSet,
          (startOffSet += childNode.textContent?.length ?? 0),
        ]);
      } else {
        children.push(...a(childNode, startOffSet, false));
        const last = children.at(-1);
        if (last) {
          startOffSet = last[2];
        }
      }
      console.log({ children });
      if (children.length) {
        startOffSet += 1;
        result.push(...children);
      }
    }

    return result;
  }

  function getBlockCaretPosition(block: IBlock) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const result = a(block.target, 0, true);
    console.log({ result });
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          console.log({ item, endOffset });
          return item[1] + endOffset;
        }
      }
    }

    return 0;
  }

  function changeCaretPosition(block: LineBlock, position: number) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const result = a(block.target, 0, false);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (position >= item[1] && position <= item[2]) {
          const selection = document.getSelection();
          assert(!!selection, "no selection");
          selection.collapse(item[0], position - item[1]);
          return;
        }
      }
    }
  }

  function getBlockIndentLevel(block: LineBlock) {
    let indent = 0;
    let parent = block.parent;
    while (parent) {
      if (isLineBlock(parent)) {
        indent += 1;
        parent = parent.parent;
      } else {
        break;
      }
    }
    return indent;
  }

  function moveCaret(direction: "up" | "down" | "left" | "right") {
    const element = document.activeElement;
    if (!element || !(element instanceof HTMLElement)) return;
    const block = mapRef.current.get(element);
    if (!block || !isLineBlock(block)) return;

    let nextBlock: LineBlock | null = null;
    if (direction === "down") {
      const children = Array.from(block.children);
      if (children.length) {
        nextBlock = children[0];
      } else if (block.next) {
        nextBlock = block.next;
      } else if (isLineBlock(block.parent)) {
        let parent: LineBlock | RootBlock = block.parent;
        while (!nextBlock && isLineBlock(parent)) {
          nextBlock = parent.next;
          parent = parent.parent;
        }
      }
    }
    if (direction === "up") {
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
    }

    if ((direction === "up" || direction === "down") && nextBlock && nextBlock.target) {
      const addition = getBlockIndentLevel(block) * 3;
      const nextBlockAddition = getBlockIndentLevel(nextBlock) * 3;
      let fromCaret = getBlockCaretPosition(block) + addition;
      const toTextLen = (nextBlock.target.textContent?.length ?? 0) + nextBlockAddition;
      console.log({ fromCaret, toTextLen, addition, nextBlockAddition });
      if (fromCaret > toTextLen && !intentCaret.current) {
        console.log("update caret position", fromCaret);
        intentCaret.current = fromCaret;
        changeCurrentBlock(block);
        changeCaretPosition(nextBlock, toTextLen - nextBlockAddition);
        return;
      }

      if (intentCaret.current) {
        console.log("restore caret position", intentCaret.current);
        changeCurrentBlock(block);
        changeCaretPosition(
          nextBlock,
          Math.min(intentCaret.current, toTextLen) - nextBlockAddition,
        );
        return;
      }

      changeCurrentBlock(block);
      changeCaretPosition(nextBlock, fromCaret - nextBlockAddition);
      return;
    }
    if (direction === "left" || direction === "right") {
      if (intentCaret.current) intentCaret.current = undefined;
    }
  }

  function moveCaretTo(block: IBlock) {
    assert(!!block.target);
    const result = a(block.target, 0, false);
    if (result.length === 0) {
      const selection = document.getSelection();
      assert(!!selection);
      selection.collapse(block.target);
    }
  }

  function resetIntentCaret() {
    intentCaret.current = undefined;
  }

  function openCommandPrompt(block: IBlock, anchor: HTMLElement) {
    // assert(!!block.el, "No dom node associate with this block: " + block.id);
    const elementRect = anchor.getBoundingClientRect();
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    flushSync(() =>
      setCommandPromptState({
        block,
        anchor,
        open: true,
        left: rect.left,
        top: rect.top + elementRect.height,
      }),
    );
    selection.collapse(anchor.childNodes[0], 1);
  }

  function closeCommandPrompt() {
    const block = commandPromptState.block;
    if (!block || !commandPromptState.anchor) return;
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    block.target.removeChild(commandPromptState.anchor);
    setCommandPromptState((prev) => ({ ...prev, open: false }));
  }

  // TODO: Figure out how to do this more efficiency
  function observeContent(block: TextBlock) {
    const contentChangeObserver = new MutationObserver((entries) => {
      const entry = entries[0];
      block.content = entry.target.textContent;
    });
    assert(!!block.target, "no dom node: " + block.id);
    contentChangeObserver.observe(block.target, { characterData: true, subtree: true });
  }

  function insertInlineOption(block: LineBlock) {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    block.target.appendChild(div);
    const inlineOption = block.inlineChildren.createBlock("inline-option");
    const option1 = inlineOption.inlineChildren.createBlock("option");
    const option2 = inlineOption.inlineChildren.createBlock("option");
    inlineOption.inlineChildren.addBlockToEnd(option1);
    inlineOption.inlineChildren.addBlockToEnd(option2);
    block.inlineChildren.addBlockToEnd(inlineOption);
    // observeContent(option1);
    // observeContent(option2);

    return inlineOption;
  }

  function changeCurrentBlock(block: LineBlock) {
    console.log(block.target);
    assert(!!block.target, "no dom node: " + block.id);
    const selection = document.getSelection();
    assert(!!selection);
    selection.collapse(block.target, 0);
    setBlock(block);
  }

  function getBlockFromTarget(target: HTMLElement) {
    return mapRef.current.get(target);
  }

  return {
    blocks: blockRef.current,
    currentBlock: block,
    changeCurrentBlock,
    registerBlock,
    moveCaret,
    changeCaretPosition,
    resetIntentCaret,
    rerender,
    commandPromptState,
    openCommandPrompt,
    closeCommandPrompt,
    insertInlineOption,
    moveCaretTo,
    getBlockCaretPosition,
    getBlockFromTarget,
  };
}

// function isInlineOption(block: IBlock): block is InlineBlock {
//   return block.type === "inline-option";
// }

// function isBlock(block: any): block is IBlock {
//   return isLineBlock(block) || isInlineOption(block);
// }
