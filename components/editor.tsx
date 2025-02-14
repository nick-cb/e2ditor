"use client";

import React, { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";

export function Editor() {
  const editor = useEditor();

  return (
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
            event.preventDefault();
            const newBlock = editor.addBlock();
            editor.focusBlock(newBlock.id);
            return;
          }
          if (key.toLowerCase() === "backspace") {
            if (!block.el?.textContent && editor.blocks.length > 1) {
              const blockIndex = editor.blocks.findIndex((b) => b.id === block.id);
              const previousBlock = editor.blocks[blockIndex - 1];
              if (previousBlock) {
                event.preventDefault();
                editor.deleteBlock(block.id);
                editor.focusBlock(previousBlock.id);
              }
            }
          }
          if (key === "/") {
            editor.showCommandPrompt(block.id);
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
          editor.updateCaretPosition(block.id, event);
        }}
        onClick={(event) => editor.updateCaretPosition(block.id, event)}
        className={"w-full"}
      />
    </div>
  );
}

export function EditorTitle() {
  return <div>Untitled Test</div>;
}

export function useEditor() {
  const blocksRef = useRef<
    {
      id: string;
      el?: HTMLDivElement;
      selection: { anchorNode: Node | null; anchorOffset: number } | null;
    }[]
  >([]);
  const [_, setRender] = useState(false);
  function focusBlock(id: string, options?: { restoreCaretPosition: boolean }) {
    console.log(
      blocksRef.current,
      blocksRef.current.find((b) => b.id === id),
    );
    const block = blocksRef.current.find((b) => b.id === id);
    if (!block) return;
    block.el?.focus();
    if (options?.restoreCaretPosition && block.selection) {
      document.getSelection()?.collapse(block.selection.anchorNode, block.selection.anchorOffset);
    }
  }

  function addBlock() {
    const newBlock = { id: crypto.randomUUID(), selection: null };
    blocksRef.current.push(newBlock);
    flushSync(() => setRender((prev) => !prev));
    return newBlock;
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
    console.log({ el: block?.el });
  }

  function updateCaretPosition(id: string, event: React.SyntheticEvent<HTMLDivElement>) {
    const block = blocksRef.current.find((b) => b.id === id);
    if (!block) return;
    block.el?.focus();
    const selection = document.getSelection();
    if (!selection || !block.el) return;
    block.selection = { anchorNode: selection.anchorNode, anchorOffset: selection.anchorOffset };
    console.log(selection, selection.anchorOffset, selection.rangeCount);
  }

  return {
    blocks: blocksRef.current,
    focusBlock,
    addBlock,
    registerBlock,
    deleteBlock,
    showCommandPrompt,
    updateCaretPosition,
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
