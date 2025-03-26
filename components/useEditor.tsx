import { useCallback, useEffect, useRef, useState } from "react";
import {
  BlockList,
  IBlock,
  InlineOptionBlock,
  LineBlock,
  RootBlock,
  OptionBlock,
} from "@/components/block";
import { flushSync } from "react-dom";
import { renderToString } from "react-dom/server";
import { assert, isLineBlock, useComposedRefs } from "@/lib/utils";
import { CommandPromptState } from "@/components/editor";
import { InlineOption } from "./inline-option";

export function useEditor() {
  const [, setRender] = useState(false);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const composedRef = useComposedRefs(
    containerRef,
    useCallback((current: HTMLDivElement) => {
      const observer = new MutationObserver((entries) => {
        for (const entry of entries) {
          if (entry.type === "childList") {
            for (const node of entry.addedNodes) {
              if (node.nodeType === 3) {
                // create text node
              }
            }
            for (const node of entry.removedNodes) {
              // remove node from mapRef
            }
          }
        }
      });
      observer.observe(current, { subtree: true, childList: true });
      return () => {
        observer.disconnect();
      };
    }, []),
  );

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
        }
      });
    }

    attachEvent(blockRef.current.children);
  }, [blockRef]);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new MutationObserver((entries) => {
        for (const entry of entries) {
          if (entry.type !== "childList") continue;
          for (const node of entry.removedNodes) {
            const block = mapRef.current.get(node as HTMLElement);
            if (block) blockRef.current.children.deleteBlock(block as LineBlock);
          }
        }
      });
      observer.observe(containerRef.current, { childList: true });
    }
  }, []);

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
      if (children.length) {
        startOffSet += 1;
        result.push(...children);
      } else {
        result.push([childNode, startOffSet, startOffSet]);
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
    for (const item of result) {
      if (item[0] instanceof Node) {
        if (item[0] === endNode) {
          return item[1] + endOffset;
        }
      }
    }

    return 0;
  }

  function changeCaretPosition(block: LineBlock, position: number) {
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    const result = a(block.target, 0, false);
    if (!result.length) {
      const selection = document.getSelection();
      assert(!!selection, "no selection");
      selection.collapse(block.target, 0);
      return;
    }
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
    const block = getCurrentBlock();
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
      if (fromCaret > toTextLen && !intentCaret.current) {
        intentCaret.current = fromCaret;
        changeCaretPosition(nextBlock, toTextLen - nextBlockAddition);
        return;
      }

      if (intentCaret.current) {
        changeCaretPosition(
          nextBlock,
          Math.min(intentCaret.current, toTextLen) - nextBlockAddition,
        );
        return;
      }

      changeCaretPosition(nextBlock, fromCaret - nextBlockAddition);
      return;
    }
    if (direction === "left" || direction === "right") {
      if (intentCaret.current) intentCaret.current = undefined;
      let fromCaret = getBlockCaretPosition(block);
    }
  }

  function moveCaretTo(block: LineBlock, position?: number) {
    assert(!!block.target);
    const result = a(block.target, 0, false);
    if (result.length === 0) {
      const selection = document.getSelection();
      assert(!!selection);
      selection.collapse(block.target, position);
    }
    changeCaretPosition(block, position ?? 0);
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
  // function observeContent(block: TextBlock) {
  //   const contentChangeObserver = new MutationObserver((entries) => {
  //     const entry = entries[0];
  //     block.content = entry.target.textContent;
  //   });
  //   assert(!!block.target, "no dom node: " + block.id);
  //   contentChangeObserver.observe(block.target, { characterData: true, subtree: true });
  // }

  function insertInlineOption(block: LineBlock) {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    assert(!!block.target, "No dom node associate with this block: " + block.id);
    block.target.appendChild(div);
    const inlineOption = new InlineOptionBlock(block, null, null);
    const option1 = new OptionBlock(inlineOption);
    const option2 = new OptionBlock(inlineOption);
    inlineOption.inlineChildren.addBlockToEnd(option1);
    inlineOption.inlineChildren.addBlockToEnd(option2);
    block.inlineChildren.addBlockToEnd(inlineOption);
    return inlineOption;
  }

  function getBlockFromTarget(target: HTMLElement) {
    return mapRef.current.get(target);
  }

  function getCurrentBlock() {
    const selection = document.getSelection();
    assert(!!selection);
    let node = selection.anchorNode;
    if (!node) return null;
    while (node && !mapRef.current.get(node as HTMLElement)) {
      node = node.parentNode;
    }
    if (node) return mapRef.current.get(node as HTMLElement) ?? null;

    return null;
  }

  function getLineBlockParent(block: IBlock) {
    if ("parent" in block) {
      let parent = block.parent as any;
      while (parent && !isLineBlock(parent)) {
        parent = parent.parent;
      }
      return parent;
    }

    return null;
  }

  function cut() {
    const selection = document.getSelection();
    assert(!!selection);
    const range = selection.getRangeAt(0);
    const selectedNodes = [];
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ALL, {
      acceptNode: (node) =>
        range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });

    let result = "";
    for (const block of blockRef.current.children) {
      // const nodeRange = document.createRange();
      assert(!!block.target, "no dom node: " + block.id);
      // nodeRange.selectNode(block.target);
      const walker = document.createTreeWalker(block.target, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) =>
          range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      });
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeRange = document.createRange();
        // console.log(node);
        // const fullySelected =
        //   range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 &&
        //   range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;
      }
    }
    // while (walker.nextNode()) {
    //   const node = walker.currentNode;
    //   const nodeRange = document.createRange();
    //   nodeRange.selectNode(node);
    //   const fullySelected =
    //     range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 &&
    //     range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;

    //   selectedNodes.push({
    //     node,
    //     fullySelected,
    //     range: {
    //       startOffset: range.startOffset,
    //       endOffset: range.endOffset,
    //     },
    //   });
    // }
    // console.log({ selectedNodes });
  }

  return {
    editorContainerRef: composedRef,
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
    getBlockFromTarget,
    getCurrentBlock,
    cut,
    getLineBlockParent,
  };
}
