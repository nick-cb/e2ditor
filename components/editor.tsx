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
          if (lastBlock && !lastBlock.el?.textContent) {
            return editor.focusBlock(lastBlock.id);
          }
          const newBlock = editor.addBlock();
          if (!newBlock) return;
          editor.focusBlock(newBlock.id);
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
  const ref = useCallback(editor.registerBlock(block.id), []);
  return (
    <div className={"flex gap-2"}>
      <div>•</div>
      <div
        id={block.id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={(event) => {
          const key = event.key;
          if (!event.shiftKey && key.toLowerCase() === "enter") {
            if (editor.commandPromptState.open) {
              event.preventDefault();
              const span = document.createElement("span");
              span.style.background = "red";
              span.style.width = "50px";
              span.style.minHeight = "16px";
              span.style.display = "inline-block";
              const span2 = document.createElement("span");
              span2.style.background = "blue";
              span2.style.width = "50px";
              span2.style.minHeight = "16px";
              span2.style.display = "inline-block";
              event.currentTarget.appendChild(span);
              event.currentTarget.append("/");
              event.currentTarget.append(span2);
              editor.closeCommandPrompt();
              return;
            }
            event.preventDefault();
            const anchorOffset = block.selection?.anchorOffset;
            const contentLength = event.currentTarget.textContent?.length;
            const isEndOfLine = anchorOffset && contentLength && anchorOffset <= contentLength;
            if (isEndOfLine) {
              const newBlock = editor.addBlockAfter(block);
              const newElement = newBlock.el!;
              const blockElement = block.selection?.anchorNode!;
              document.getSelection()?.collapse(block.selection?.anchorNode!, anchorOffset - 1);
              if (blockElement && newElement) {
                const textContent = blockElement.textContent!;
                const part1 = textContent.substring(0, anchorOffset);
                const part2 = textContent.substring(anchorOffset);
                blockElement.textContent = part1;
                newElement.textContent = part2;
                document.getSelection()?.collapse(blockElement, anchorOffset);
                editor.updateCaretPosition(newBlock.id);
                document.getSelection()?.collapse(newBlock.selection?.anchorNode!, part2.length);
              }
            }
            return;
          }
          if (key.toLowerCase() === "backspace") {
            const anchorOffset = block.selection!.anchorOffset;
            console.log({ anchorOffset });
            if (anchorOffset > 0) return;

            const blockIndex = editor.blocks.findIndex((b) => b.id === block.id);
            const previousBlock = editor.blocks[blockIndex - 1];
            if (previousBlock) {
              event.preventDefault();
              editor.deleteBlock(block.id);
              editor.focusBlock(previousBlock.id, { restoreCaretPosition: true });
              return;
              // console.log(
              //   previousBlock.selection!.anchorNode,
              //   previousBlock.el!.textContent?.length ?? 0,
              // );
              // document
              //   .getSelection()
              //   ?.collapse(
              //     previousBlock.selection!.anchorNode,
              //     previousBlock.el!.textContent?.length ?? 0,
              //   );
            }
          }
          if (key === "/") {
            event.preventDefault();
            const span = document.createElement("span");
            span.textContent = "/";
            event.currentTarget.appendChild(span);
            editor.showCommandPrompt(block.id);
            document.getSelection()?.collapse(span.childNodes[0], 1);
            const mutationObserver = new MutationObserver((list) => {
              for (const item of list) {
                if (item.removedNodes.values().find((node) => node === span)) {
                  editor.closeCommandPrompt();
                }
              }
            });
            mutationObserver.observe(span.childNodes[0], { characterData: true });
            mutationObserver.observe(event.currentTarget, { subtree: true, childList: true });
            return;
          }
          if (key.toLowerCase() === "arrowup") {
            const blockIndex = editor.blocks.findIndex((b) => b.id === block.id);
            const previousBlock = editor.blocks[blockIndex - 1];
            if (previousBlock) {
              event.preventDefault();
              editor.focusBlock(previousBlock.id, { restoreCaretPosition: true });
            }
          }
          if (key.toLowerCase() === "arrowdown") {
            const blockIndex = editor.blocks.findIndex((b) => b.id === block.id);
            const nextBlock = editor.blocks[blockIndex + 1];
            if (nextBlock) {
              event.preventDefault();
              editor.focusBlock(nextBlock.id, { restoreCaretPosition: true });
            }
          }
        }}
        onKeyUp={(event) => {
          const key = event.key;
          if (!event.shiftKey && key.toLowerCase() === "enter") return;
          editor.updateCaretPosition(block.id);
        }}
        onClick={(event) => editor.updateCaretPosition(block.id)}
        className={"w-full"}
      />
    </div>
  );
}

export function EditorTitle() {
  return <div>Untitled Test</div>;
}

type Block = {
  id: string;
  el?: HTMLDivElement;
  selection: { anchorNode: Node | null; anchorOffset: number } | null;
};
function useEditor() {
  const blocksRef = useRef<Block[]>([]);
  const [_, setRender] = useState(false);
  const [commandPromptState, setCommandPromptState] = useState<{
    block: Block | null;
    open: boolean;
    top: number;
    left: number;
  }>({
    block: null,
    open: false,
    left: 0,
    top: 0,
  });

  function focusBlock(id: string, options?: { restoreCaretPosition: boolean }) {
    const block = blocksRef.current.find((b) => b.id === id);
    if (!block) return;
    block.el?.focus();
    if (options?.restoreCaretPosition && block.selection) {
      console.log(block.selection.anchorNode, block.selection.anchorOffset);
      document.getSelection()?.collapse(block.selection.anchorNode, block.selection.anchorOffset);
    }
  }

  // NOTE: Should addBlock control more of the behaviors, eg: content, text, child node, selection?
  function addBlock() {
    const newBlock = { id: crypto.randomUUID(), selection: null };
    const index = blocksRef.current.push(newBlock);
    flushSync(() => setRender((prev) => !prev));
    // updateCaretPosition(newBlock.id);
    // console.log(index, blocksRef.current[index - 1]);
    return blocksRef.current[index - 1];
  }

  function addBlockAfter(block: any) {
    const newBlock = { id: crypto.randomUUID(), selection: null };
    const index = blocksRef.current.findIndex((b) => b.id === block.id) + 1;
    blocksRef.current.splice(index, 0, newBlock);
    flushSync(() => setRender((prev) => !prev));
    // updateCaretPosition(newBlock.id);
    return blocksRef.current[index];
  }

  function deleteBlock(id: string) {
    const blockIdex = blocksRef.current.findIndex((b) => b.id === id);
    blocksRef.current.splice(blockIdex, 1);
    flushSync(() => setRender((prev) => !prev));
  }

  const registerBlock = useCallback((id: string) => {
    return (current: HTMLDivElement) => {
      const block = blocksRef.current.find((b) => b.id === id);
      if (!block) return;
      block.el = current;
    };
  }, []);

  function showCommandPrompt(id: string) {
    const block = blocksRef.current.find((b) => b.id === id);
    const selection = document.getSelection();
    if (!selection || !block?.el) return null;
    const elementRect = block.el.getBoundingClientRect();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    flushSync(() =>
      setCommandPromptState({
        block,
        open: true,
        left: rect.left,
        top: rect.top + elementRect.height,
      }),
    );
    focusBlock(block.id);
    // const div = document.createElement("div");
    // div.style.position = "fixed";
    // div.style.left = rect.left + "px";
    // div.style.top = rect.top + elementRect.height + "px";
    // div.style.width = "100px";
    // div.style.height = "100px";
    // div.style.background = "blue";
    // div.style.zIndex = "9999";
    // document.body.appendChild(div);
  }

  function closeCommandPrompt() {
    setCommandPromptState((prev) => ({ ...prev, open: false }));
  }

  function updateCaretPosition(id: string) {
    const block = blocksRef.current.find((b) => b.id === id);
    if (!block) return;
    block.el?.focus();
    const selection = document.getSelection();
    if (!selection) return;
    block.selection = { anchorNode: selection.anchorNode, anchorOffset: selection.anchorOffset };
    console.log(selection, selection.anchorOffset, selection.rangeCount);
  }

  return {
    blocks: blocksRef.current,
    commandPromptState,
    focusBlock,
    addBlock,
    addBlockAfter,
    registerBlock,
    deleteBlock,
    showCommandPrompt,
    updateCaretPosition,
    closeCommandPrompt,
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
