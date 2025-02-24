"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Editor() {
  const editor = useEditor();

  return (
    <div className={"h-full"}>
      <div
        onClick={(event) => {
          if (event.currentTarget !== event.target) return;
          const lastBlock = editor.blocks.at(-1);
          if (!lastBlock || lastBlock.el?.textContent) {
            const newBlock = editor.addBlock();
            editor.focusBlock(newBlock);
            editor.updateCaretPosition(newBlock);
          }
        }}
        className={"min-h-full border cursor-text"}
      >
        {editor.blocks.map((block) => {
          return <Block key={block.id} editor={editor} block={block} />;
        })}
        {/* <CommandPrompt editor={editor} /> */}
      </div>
      <CommandPrompt2 editor={editor} />
    </div>
  );
}

export function Block({
  editor,
  block,
}: {
  editor: ReturnType<typeof useEditor>;
  block: ReturnType<typeof useEditor>["blocks"][number];
}) {
  const ref = useCallback(editor.registerBlock(block), []);

  return (
    <div className={"flex gap-2"}>
      <div>•</div>
      <div
        id={block.id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={(event) => {
          assert(!!block.el, "No dom node associate with this block: " + block.id);
          if (!event.shiftKey && event.key.toLowerCase() === "enter") {
            event.preventDefault();
            if (editor.commandPromptState.open) {
              const inlineOption = editor.insertInlineOption(block);
              const selection = document.getSelection();
              assert(!!selection, "selection is null");
              editor.closeCommandPrompt();
              const inlineOption1 = inlineOption.children[0];
              assert(!!inlineOption1.el, "No dom node associate with this block: " + block.id);
              editor.collapseCaretToNode(inlineOption1.el, 0);
              return;
            }
            const newBlock = editor.addBlockAfter(block);
            editor.focusBlock(newBlock);
          }
          if (event.key.toLowerCase() === "arrowup") {
            event.preventDefault();
            const index = editor.blocks.findIndex((b) => b.id === block.id);
            const previousBlock = editor.blocks[index - 1];
            if (previousBlock) {
              editor.focusBlock(previousBlock);
            }
          }
          if (event.key.toLowerCase() === "arrowdown") {
            event.preventDefault();
            const index = editor.blocks.findIndex((b) => b.id === block.id);
            const nextBlock = editor.blocks[index + 1];
            if (nextBlock) {
              editor.focusBlock(nextBlock);
            }
          }
          if (event.key.toLowerCase() === "/") {
            event.preventDefault();
            const span = document.createElement("span");
            span.textContent = "/";
            block.el.append(span);
            editor.openCommandPrompt(block, span);
          }
        }}
        onKeyUp={() => editor.updateCaretPosition(block)}
        onClick={() => editor.updateCaretPosition(block)}
        className={"w-full flex items-center"}
      >
        {/* <div className={'min-h-6 bg-blue-500 min-w-10'}></div> */}
        {block.children.map((child) => {
          if (child.type === "inline-option") {
            return (
              <React.Fragment key={child.id}>
                <div className={"inline-option flex items-center"}>
                  <div
                    ref={editor.registerBlock(child.children[0])}
                    key={child.children[0].id}
                    contentEditable
                    suppressContentEditableWarning
                    className={"px-1 min-h-6 bg-red-200"}
                  />
                </div>
                <div
                  ref={editor.registerBlock(child.children[1])}
                  key={child.children[1].id}
                  contentEditable
                  suppressContentEditableWarning
                  className={"px-1 min-h-6 bg-green-200"}
                />
              </React.Fragment>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function EditorTitle() {
  return <div>Untitled Test</div>;
}

type TInlineOption = TBlock & {
  parent: TBlock;
};
type TBlock = {
  id: string;
  type: string;
  el?: HTMLDivElement;
  children: TBlock[];
  caretPos: number;
  // parent: TBlock | null;
};
function useEditor() {
  const intentCaretPos = useRef(0);
  const blockMapRef = useRef<Map<HTMLElement, TBlock>>(new Map());
  const blocksRef = useRef<TBlock[]>([]);
  const [_, setRender] = useState(false);
  const [commandPromptState, setCommandPromptState] = useState<{
    block: TBlock | null;
    anchor: HTMLElement | null;
    open: boolean;
    top: number;
    left: number;
  }>({
    block: null,
    anchor: null,
    open: false,
    left: 0,
    top: 0,
  });
  const [observer] = useState(
    new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.type === "childList") {
          // carretPos.current = entry.target.textContent
        }
      }
    }),
  );

  function focusBlock(block: TBlock) {
    assert(!!block, "no block found");
    assert(!!block.el, "No dom node associate with this block: " + block.id);

    block.el.focus();
  }

  // NOTE: Should addBlock control more of the behaviors, eg: content, text, child node, selection?
  function addBlock() {
    const newBlock: TBlock = { id: crypto.randomUUID(), type: "block", children: [], caretPos: 0 };
    blocksRef.current.push(newBlock);
    flushSync(() => setRender((prev) => !prev));
    // observer.observe(newBlock.el!, { childList: true });
    newBlock.caretPos = getBlockCaretPosition(newBlock);
    return newBlock;
  }

  function addBlockAfter(block: TBlock) {
    const index = blocksRef.current.findIndex((b) => b.id === block.id);
    const newBlock: TBlock = {
      id: crypto.randomUUID(),
      type: "block",
      children: [],
      caretPos: 0,
    };
    blocksRef.current.splice(index + 1, 0, newBlock);
    flushSync(() => setRender((prev) => !prev));
    newBlock.caretPos = getBlockCaretPosition(newBlock);
    return newBlock;
  }

  function deleteBlock(block: TBlock) {}

  const registerBlock = useCallback((block: TBlock) => {
    return (current: HTMLDivElement) => {
      block.el = current;
      if (current) blockMapRef.current.set(current, block);
      // if (current)
      //   observer.observe(current, { characterData: true, subtree: true, childList: true });
      // return () => {
      //   if (current) blockMapRef.current.delete(current);
      // };
    };
  }, []);

  // const registerChildren = useCallback((id: string, childId: string) => {
  //   return (current: HTMLElement) => {
  //     const block = blocksRef.current.find((b) => b.id === id);
  //     if (!block) return;
  //     const children = block.children.find((c) => c.id === childId);
  //     // if (!children.contents) children.contents = new Set();
  //     // if (children) children.contents.add(current);
  //   };
  // }, []);

  function openCommandPrompt(block: TBlock, anchor: HTMLElement) {
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
    assert(!!block.el, "No dom node associate with this block: " + block.id);
    block.el.removeChild(commandPromptState.anchor);
    setCommandPromptState((prev) => ({ ...prev, open: false }));
  }

  function updateCaretPosition(block: TBlock) {
    assert(!!block.el, "No dom node associate with this block: " + block.id);
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const result = a(block.el, 0);
    console.log(result, selection);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          block.caretPos = item[1] + endOffset;
          setRender((prev) => !prev);
        }
      }
    }
  }

  function insertInlineOption(block: TBlock) {
    const inlineOption: TInlineOption = {
      id: crypto.randomUUID(),
      type: "inline-option",
      children: [],
      parent: block,
      caretPos: 0,
    };
    const inlineOption1: TInlineOption = {
      id: crypto.randomUUID(),
      type: "inline-option-1",
      children: [],
      parent: inlineOption,
      caretPos: 0,
    };
    const inlineOption2: TInlineOption = {
      id: crypto.randomUUID(),
      type: "inline-option-2",
      children: [],
      parent: inlineOption,
      caretPos: 0,
    };
    inlineOption.children = [inlineOption1, inlineOption2];

    block.children.push(inlineOption);

    flushSync(() => setRender((prev) => !prev));

    return inlineOption;
  }

  function getBlockFromNode(node: HTMLElement | Node) {}

  function deleteBlockFromParent(parent: TBlock, block: TBlock) {}

  function a(node: Node, startOffSet: number): any[] {
    let result = [];
    for (const childNode of node.childNodes) {
      if (childNode.nodeType === 3) {
        result.push([childNode, startOffSet, (startOffSet += childNode.textContent?.length ?? 0)]);
      } else {
        result.push(...a(childNode, startOffSet));
        const last = result.at(-1);
        if (last) {
          startOffSet = last[2];
        }
      }
      startOffSet += 1;
    }
    if (!node.childNodes.length) {
      result.push([node, startOffSet, startOffSet + 1]);
    }

    return result;
  }

  // - if caret go from a line with longer text to a line with fewer text, the caret position
  // will go to the position of the longer text
  // - if caret go from aline with fewer text to a line with longer text, the caret position
  // will go to the previous position of the longer text if the position of the fewer text
  // is different with the position of the longer text
  function changeCaretPosition(block: TBlock, position: number) {
    assert(!!block.el, "No dom node associate with this block: " + block.id);
    const result = a(block.el, 0);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (position > item[1] && position <= item[2]) {
          const selection = document.getSelection();
          assert(!!selection, "no selection");
          selection.collapse(item[0], position - item[1]);
          return;
        }
      }
    }

    // const lastNode = result.at(-1);
    // if (!lastNode) return;
    // const selection = document.getSelection();
    // assert(!!selection, "no selection");
    // selection.collapse(lastNode[0], lastNode[0].textContent.length);
  }

  function moveCaretPosition(from: TBlock, to: TBlock) {
    assert(!!from.el, "No dom node associate with this block: " + from.id);
    assert(!!to.el, "No dom node associate with this block: " + to.id);

    const fromTextLen = from.el.textContent?.length ?? 0;
    const toTextLen = from.el.textContent?.length ?? 0;
    if (fromTextLen > toTextLen) {
      changeCaretPosition(to, toTextLen);
      intentCaretPos.current = from.caretPos;
      return;
    }
  }

  function getBlockCaretPosition(block: TBlock) {
    assert(!!block.el, "No dom node associate with this block: " + block.id);
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const result = a(block.el, 0);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          return item[1] + endOffset;
        }
      }
    }

    return 0;
  }

  function handleArrowKey(key: string, block: TBlock) {
    if (key === "arrowup") {
    }
    if (key === "arrowdown") {
    }
    if (key === "arrowleft") {
    }
    if (key === "arrowright") {
    }
  }

  function collapseCaretToNode(node: HTMLElement, position: number) {
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    selection.collapse(node, position);
  }

  return {
    blocks: blocksRef.current,
    blockMap: blockMapRef.current,
    commandPromptState,
    focusBlock,
    addBlock,
    addBlockAfter,
    registerBlock,
    deleteBlock,
    openCommandPrompt,
    updateCaretPosition,
    closeCommandPrompt,
    insertInlineOption,
    getBlockFromNode,
    deleteBlockFromParent,
    changeCaretPosition,
    collapseCaretToNode,
    getBlockCaretPosition,
    moveCaretPosition,
    // registerChildren,
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

function CommandPrompt({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const commandPromptState = editor.commandPromptState;

  return (
    <DropdownMenu open={commandPromptState.open}>
      {createPortal(
        <DropdownMenuTrigger
          className={"fixed"}
          style={{ left: commandPromptState.left, top: commandPromptState.top }}
        ></DropdownMenuTrigger>,
        document.body,
      )}
      <DropdownMenuContent
        onEscapeKeyDown={editor.closeCommandPrompt}
        onInteractOutside={editor.closeCommandPrompt}
        onFocusOutside={editor.closeCommandPrompt}
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuItem>Subscription</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

interface IBlock {
  id: string;
  type: string;
  target: HTMLDivElement | null;
  children: IBlock[];
}

class LineBlock implements IBlock {
  id: string;
  type: string;
  target: HTMLDivElement | null;
  children: IBlock[];
  editor: BlockEditor;

  constructor(
    id: string,
    type: string,
    target: HTMLDivElement | null,
    children: IBlock[],
    editor: BlockEditor,
  ) {
    this.id = id;
    this.type = type;
    this.target = target;
    this.children = children;
    this.editor = editor;
  }
}

class BlockEditor {
  blocks: IBlock[] = [];
  eventTarget = new EventTarget();

  addBlock() {
    const block = new LineBlock(crypto.randomUUID(), "block", null, [], this);
    this.blocks.push(block);
    this.eventTarget.dispatchEvent(new CustomEvent("add-block", { detail: { block } }));
    return block;
  }

  on(eventName: "add-block", callback: (block: Event) => void) {
    this.eventTarget.addEventListener(eventName, (event) => {
      callback(event);
    });
  }
}
