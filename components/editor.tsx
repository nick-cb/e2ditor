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
          if (!lastBlock || lastBlock.target?.textContent) {
            const newBlock = editor.addBlock();
            editor.focusBlock(newBlock);
          }
        }}
        className={"min-h-full border cursor-text"}
      >
        {editor.blocks.map((block) => {
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

  return (
    <div>
      <div className={"flex gap-2"}>
        <div>•</div>
        <div
          id={block.id}
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={(event) => {
            const key = event.key.toLowerCase();
            if (!event.shiftKey && key === "enter") {
              const newBlock = editor.addBlockAfter(block);
              editor.focusBlock(newBlock);
            }
            if (!event.shiftKey && key === "tab") {
              editor.indentBlock(block, 1);
            }
          }}
          onKeyUp={() => editor.updateCaretPosition(block)}
          onClick={() => editor.updateCaretPosition(block)}
          className={"w-full flex items-center"}
        >
          {/* <div className={'min-h-6 bg-blue-500 min-w-10'}></div> */}
          {block.inlineChildren.map((child) => {
            if (isInlineOption(child)) {
              return (
                <React.Fragment key={child.id}>
                  <div className={"inline-option flex items-center"}>
                    <div
                      ref={editor.registerBlock(child.inlineChildren[0])}
                      key={child.inlineChildren[0].id}
                      contentEditable
                      suppressContentEditableWarning
                      className={"px-1 min-h-6 bg-red-200"}
                    />
                  </div>
                  <div
                    ref={editor.registerBlock(child.inlineChildren[0])}
                    key={child.inlineChildren[0].id}
                    contentEditable
                    suppressContentEditableWarning
                    className={"px-1 min-h-6 bg-green-200"}
                  ></div>
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      </div>
      {block.children.map((child) => {
        if (child.type === "block") {
          return (
            <div key={child.id} className={"pl-4"}>
              <Block editor={editor} block={child as LineBlock} />
            </div>
          );
        }
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
function useEditor() {
  const intentCaret = useRef<number | undefined>(undefined);
  const blockMapRef = useRef<Map<HTMLElement, IBlock>>(new Map());
  const blocksRef = useRef<LineBlock[]>([]);
  const [_, setRender] = useState(false);
  const [commandPromptState, setCommandPromptState] = useState<CommandPromptState>({
    block: null,
    anchor: null,
    open: false,
    left: 0,
    top: 0,
  });

  function focusBlock(block: IBlock) {
    assert(!!block, "no block found");
    assert(!!block.target, "No dom node associate with this block: " + block.id);

    block.target.focus();
  }

  // NOTE: Should addBlock control more of the behaviors, eg: content, text, child node, selection?
  function addBlock(parent?: LineBlock) {
    const newBlock: LineBlock = {
      id: crypto.randomUUID(),
      type: "block",
      children: [],
      inlineChildren: [],
      caretPos: 0,
      target: null,
    };
    if (parent) {
      parent.children.push(newBlock);
    } else {
      blocksRef.current.push(newBlock);
    }
    flushSync(() => setRender((prev) => !prev));
    newBlock.caretPos = getBlockCaretPosition(newBlock);
    return newBlock;
  }

  function addBlockAfter(block: LineBlock) {
    const newBlock: LineBlock = {
      id: crypto.randomUUID(),
      type: "block",
      children: [],
      inlineChildren: [],
      caretPos: 0,
      target: null,
    };
    const parent = block.parent ? block.parent.children : blocksRef.current;
    const index = parent.findIndex((b) => b.id === block.id);
    parent.splice(index + 1, 0, newBlock);
    flushSync(() => setRender((prev) => !prev));
    return newBlock;
  }

  function deleteBlock(block: IBlock) {}

  const registerBlock = useCallback((block: IBlock) => {
    return (current: HTMLDivElement) => {
      block.target = current;
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

  function updateCaretPosition(block: LineBlock) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const result = a(block.target, 0);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          block.caretPos = item[1] + endOffset;
          setRender((prev) => !prev);
        }
      }
    }
  }

  function insertInlineOption(block: IBlock) {}

  function getBlockFromNode(node: HTMLElement | Node) {}

  function deleteBlockFromParent(parent: IBlock, block: IBlock) {}

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
  function changeCaretPosition(block: IBlock, position: number) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const result = a(block.target, 0);
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

    // const lastNode = result.at(-1);
    // if (!lastNode) return;
    // const selection = document.getSelection();
    // assert(!!selection, "no selection");
    // selection.collapse(lastNode[0], lastNode[0].textContent.length);
  }

  function moveCaretToSibling(block: LineBlock, offset: number) {
    const parent = block.parent ? block.parent.children : blocksRef.current;
    const blockIndex = parent.findIndex((b) => b.id === block.id);
  }

  function moveCaretPosition(direction: "up" | "down" | "left" | "right", offset: number) {}

  function resetIntentCaret() {
    intentCaret.current = undefined;
  }

  function getBlockCaretPosition(block: IBlock) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    const endNode = selection.focusNode;
    const endOffset = selection.focusOffset;
    const result = a(block.target, 0);
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          return item[1] + endOffset;
        }
      }
    }

    return 0;
  }

  function collapseCaretToNode(node: HTMLElement, position: number) {
    const selection = document.getSelection();
    assert(!!selection, "no selection");
    selection.collapse(node, position);
  }

  function changeBlockParent(block: LineBlock, newParent: LineBlock) {
    if (block.parent) {
      const index = block.parent.children.findIndex((b) => b === block);
      console.log({ block, index, newParent });
      block.parent.children.splice(index, 1);
    } else {
      const index = blocksRef.current.findIndex((b) => b === block);
      blocksRef.current.splice(index, 1);
    }
    newParent.children.push(block);
    block.parent = newParent;
    flushSync(() => setRender((prev) => !prev));
    return block;
  }

  function indentBlock(block: LineBlock, offset: number) {
    if (offset === 1) {
      const parent = block.parent ? block.parent.children : blocksRef.current;
      const index = parent.findIndex((b) => b.id === block.id);
      const previousBlock = parent[index - 1];
      if (!previousBlock) return;
      block.parent = previousBlock;
      previousBlock.children.push(block);
    } else {
      if (!block.parent) return;
      const parent = block.parent.parent ? block.parent.parent.children : blocksRef.current;
      const index = parent.findIndex((b) => b.id === block.parent!.id);
      parent.splice(index + 1, 0, block);
      block.parent = block.parent.parent;
    }
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
    resetIntentCaret,
    changeBlockParent,
    indentBlock,
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
}

interface LineBlock extends IBlock {
  caretPos: number;
  parent?: LineBlock;
  inlineChildren: IBlock[];
  children: LineBlock[];
}

interface InlineBlock extends IBlock {
  parent: IBlock;
  inlineChildren: InlineBlock[];
}

interface TextBlock extends IBlock {
  textContent?: string;
}

function isLineBlock(block: IBlock): block is LineBlock {
  return block.type === "block";
}

function isInlineOption(block: IBlock): block is InlineBlock {
  return block.type === "inline-option";
}
