"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BlockList,
  createBlockList,
  IBlock,
  InlineOptionBlock,
  LineBlock,
  RootBlock,
  TextBlock,
} from "./block";
import { Button } from "./ui/button";
import { GripVerticalIcon } from "lucide-react";
import { InlineOption } from "./inline-option";

let i = 0;
export function Editor() {
  const editor = useEditor();

  return (
    <div className={"h-full"}>
      <div
        onClick={(event) => {
          if (event.currentTarget !== event.target) return;
          const block = editor.blocks.children.createBlock("block");
          const lastBlock = editor.blocks.children.getLastBlock();
          if (!lastBlock || (lastBlock.target && !!lastBlock.target.textContent)) {
            editor.blocks.children.addBlockToEnd(block);
            assert(!!block.target, "no dom node: " + block.id);
            block.target.focus();
            return;
          }
          assert(!!lastBlock.target, "no dom node: " + lastBlock.id);
          lastBlock.target.focus();
        }}
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

type BlockProps = {
  editor: ReturnType<typeof useEditor>;
  block: LineBlock;
};
export function Block({ editor, block }: BlockProps) {
  const ref = useCallback(editor.registerBlock(block), []);
  const [render, setRender] = useState(false);

  return (
    <div>
      <div className={"flex relative items-center group"}>
        <Button
          size={"sm"}
          variant={"ghost"}
          className={
            "absolute left-0 -translate-x-full !w-max !h-max p-1 group-hover:opacity-100 opacity-0 transition-opacity"
          }
        >
          <GripVerticalIcon />
        </Button>
        <div
          id={block.id}
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={(event) => {
            const key = event.key.toLowerCase();
            if (!event.shiftKey && key === "enter") {
              event.preventDefault();
              if (editor.commandPromptState.open) {
                const inlineOption = editor.insertInlineOption(block);
                editor.closeCommandPrompt();
                editor.moveCaretTo(Array.from(inlineOption.inlineChildren)[0]);
                // console.log({ inlineOption });
                // editor.moveCaretTo(Array.from(inlineOption.inlineChildren)[0]);
                return;
              }
              const parent = block.parent;
              const newBlock = parent.children.insertBlockAfter(
                block,
                parent.children.createBlock("block"),
              );
              assert(!!newBlock.target, "no dom node: " + newBlock.id);
              newBlock.target.focus();
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
              block.target.focus();
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
              block.target.focus();
              return;
            }
            if (key === "arrowup") {
              event.preventDefault();
              editor.moveCaret("up");
              return;
            }
            if (key === "arrowdown") {
              event.preventDefault();
              editor.moveCaret("down");
              return;
            }
            if (key === "arrowleft") editor.moveCaret("left");
            if (key === "arrowright") editor.moveCaret("right");
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
              console.log(
                "compare",
                block === block.parent.children._tail,
                isLineBlock(block.parent),
              );

              if (block === block.parent.children._tail && isLineBlock(block.parent)) {
                block.parent.children.deleteBlock(block);
                const grandparent = block.parent.parent;
                block.parent.children.deleteBlock(block);
                grandparent.children.insertBlockAfter(block.parent, block);
                block.target.focus();
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
            }
            editor.resetIntentCaret();
          }}
          onInput={(event) => {
            event.preventDefault();
          }}
          onInputCapture={(event) => event.preventDefault()}
          className={"w-full flex items-center"}
        >
          {Array.from(block.inlineChildren).map((child) => {
            if (child.type === "inline-option") {
              return <InlineOption key={child.id} child={child} editor={editor} />;
            }
            if (child.type === "text" && !child.target?.isConnected) {
              return child.content;
            }
            return null;
          })}
          {/* <div className={'min-h-6 bg-blue-500 min-w-10'}></div> */}
          {/* {block.inlineChildren.map((child) => { */}
          {/*   if (isInlineOption(child)) { */}
          {/*     return ( */}
          {/*     ); */}
          {/*   } */}
          {/*   return null; */}
          {/* })} */}
        </div>
      </div>
      {Array.from(block.children).map((child) => {
        return (
          <div key={child.id} className={"pl-[3ch]"}>
            <Block editor={editor} block={child} />
          </div>
        );
      })}
    </div>
  );
}

export function EditorTitle() {
  return <div>Untitled Test</div>;
}

type CommandPromptState = {
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
        nextBlock.target.focus();
        changeCaretPosition(nextBlock, toTextLen - nextBlockAddition);
        return;
      }

      if (intentCaret.current) {
        console.log("restore caret position", intentCaret.current);
        nextBlock.target.focus();
        changeCaretPosition(
          nextBlock,
          Math.min(intentCaret.current, toTextLen) - nextBlockAddition,
        );
        return;
      }

      nextBlock.target.focus();
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

  return {
    blocks: blockRef.current,
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
  };
}

function composeEventHandlers<E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {},
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);

    if (checkForDefaultPrevented === false || !(event as unknown as Event).defaultPrevented) {
      return ourEventHandler?.(event);
    }
  };
}

function CommandPrompt2({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const commandPromptState = editor.commandPromptState;
  const [selectItem, setSelectItem] = useState(0);
  const [items, setItems] = useState([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: PointerEvent) => {
      // @ts-ignore
      if (menuRef.current?.contains(event.target)) editor.closeCommandPrompt();
    };
    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
    };
  }, []);

  if (!commandPromptState.open) return;

  return createPortal(
    <div
      role={"menu"}
      data-state={"open"}
      style={{ left: commandPromptState.left, top: commandPromptState.top }}
      className={cn(
        "fixed z-50 min-w-[8rem] pointer-events-auto overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "cursor-default",
      )}
    >
      <div
        role="menuitem"
        className={cn(
          "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground  data-[disabled]:opacity-50 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0",
          "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          selectItem === 0 && "bg-accent text-accent-foreground cursor-pointer",
        )}
        data-orientation="vertical"
        data-radix-collection-item=""
        data-highlight
      >
        Inline option
      </div>
    </div>,
    document.body,
  );
}

function assert(value: boolean, message?: string): asserts value {
  if (!value) throw new Error(message);
}

function isLineBlock(block: IBlock | RootBlock): block is LineBlock {
  return block.type === "block";
}

// function isInlineOption(block: IBlock): block is InlineBlock {
//   return block.type === "inline-option";
// }

// function isBlock(block: any): block is IBlock {
//   return isLineBlock(block) || isInlineOption(block);
// }

function isRootblock(block: any): block is RootBlock {
  return block.type === "root";
}

function isLineblock(block: any): block is LineBlock {
  return block.type === "block";
}
