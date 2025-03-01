"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { BlockList, createBlockList, LineBlock, RootBlock } from "./block";

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
        className={"min-h-full border cursor-text"}
      >
        {Array.from(editor.blocks.children).map((block) => {
          return <Block key={block.id} editor={editor} block={block as LineBlock} />;
        })}
        {/* <CommandPrompt editor={editor} /> */}
      </div>
      {/* <CommandPrompt2 editor={editor} /> */}
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
              const parent = block.parent;
              console.log({ parent });
              const newBlock = parent.children.insertBlockAfter(
                block,
                parent.children.createBlock("block"),
              );
              assert(!!newBlock.target, "no dom node: " + newBlock.id);
              newBlock.target.focus();
            }
            if (!event.shiftKey && key === "tab") {
              const prev = block.prev;
              if (!prev) return;
              const parent = block.parent;
              parent.children.deleteBlock(block);
              prev.children.addBlockToEnd(block);
              // editor.rerender();
              assert(!!block.target, "no dom node: " + block.id);
              block.target.focus();
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
              block.parent.children.deleteBlock(block);
              const grandParent = block.parent.parent;
              console.log({ parent: block.parent, grandParent: block.parent.parent });
              grandParent.children.insertBlockAfter(block.parent, block);
            }
          }}
          // onKeyUp={() => editor.updateCaretPosition(block)}
          // onClick={() => editor.updateCaretPosition(block)}
          className={"w-full flex items-center"}
        >
          {/* <div className={'min-h-6 bg-blue-500 min-w-10'}></div> */}
          {/* {block.inlineChildren.map((child) => { */}
          {/*   if (isInlineOption(child)) { */}
          {/*     return ( */}
          {/*       <React.Fragment key={child.id}> */}
          {/*         <div className={"inline-option flex items-center"}> */}
          {/*           <div */}
          {/*             // ref={editor.registerBlock(child.inlineChildren[0])} */}
          {/*             key={child.inlineChildren[0].id} */}
          {/*             contentEditable */}
          {/*             suppressContentEditableWarning */}
          {/*             className={"px-1 min-h-6 bg-red-200"} */}
          {/*           /> */}
          {/*         </div> */}
          {/*         <div */}
          {/*           // ref={editor.registerBlock(child.inlineChildren[0])} */}
          {/*           key={child.inlineChildren[0].id} */}
          {/*           contentEditable */}
          {/*           suppressContentEditableWarning */}
          {/*           className={"px-1 min-h-6 bg-green-200"} */}
          {/*         ></div> */}
          {/*       </React.Fragment> */}
          {/*     ); */}
          {/*   } */}
          {/*   return null; */}
          {/* })} */}
        </div>
      </div>
      {Array.from(block.children).map((child) => {
        return (
          <div key={child.id} className={"pl-4"}>
            <Block editor={editor} block={child as LineBlock} />
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
function useEditor() {
  const [render, setRender] = useState(false);
  const blockRef = useRef(new RootBlock());

  useEffect(() => {
    if (!blockRef.current) return;
    function attachEvent(children: BlockList<LineBlock>) {
      const handler = () => {
        console.log("flush sync");
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
        }
      });
    }
    attachEvent(blockRef.current.children);
  }, [blockRef]);

  function registerBlock(block: LineBlock) {
    return (current: HTMLDivElement) => {
      block.target = current;
      return () => {
        block.target = current;
      };
    };
  }

  function rerender() {
    flushSync(() => setRender((prev) => !prev));
  }

  return { blocks: blockRef.current, registerBlock, rerender };
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

// interface IBlock {
//   id: string;
//   type: string;
//   target: HTMLDivElement | null;
// }

// interface LineBlock extends IBlock {
//   caretPos: number;
//   parent: LineBlock | null;
//   inlineChildren: IBlock | null;
//   children: {
//     _blocks: LineBlock | null;
//     [Symbol.iterator](): Generator<LineBlock, void, unknown>;
//   };
//   next: LineBlock | null;
//   prev: LineBlock | null;
// }

// interface InlineBlock extends IBlock {
//   parent: IBlock;
//   inlineChildren: InlineBlock[];
// }

// interface TextBlock extends IBlock {
//   textContent?: string;
// }

// function isLineBlock(block: IBlock): block is LineBlock {
//   return block.type === "block";
// }

// function isInlineOption(block: IBlock): block is InlineBlock {
//   return block.type === "inline-option";
// }
