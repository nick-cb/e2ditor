import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GripVerticalIcon } from "lucide-react";
import { InlineOption } from "@/components/inline-option";
import { LineBlock } from "@/components/block";

import { useEditor } from "@/components/useEditor";

export type BlockProps = {
  editor: ReturnType<typeof useEditor>;
  block: LineBlock;
};

export function Block({ editor, block }: BlockProps) {
  const a = useRef<HTMLDivElement>(null);
  const ref = useCallback((current: HTMLDivElement) => {
    a.current = current;
    const fn = editor.registerBlock(block);
    fn(current);
  }, []);

  useEffect(() => {
    if (a.current && block.html) {
      a.current.innerHTML = block.html;
    }
  }, []);

  return (
    <div className={"w-full min-h-6"}>
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
          // onClick={() => {
          //   editor.changeCurrentBlock(block);
          // }}
          onInput={(event) => {
            event.preventDefault();
          }}
          onInputCapture={(event) => event.preventDefault()}
          className={"w-full flex items-center h-6 bg-yellow-500"}
        >
          {Array.from(block.inlineChildren).map((child) => {
            if (child.type === "inline-option") {
              return (
                <InlineOption key={child.id} block={child} registerBlock={editor.registerBlock} />
              );
            }
            // if (child.type === "text" && !child.target?.isConnected) {
            //   return child.content;
            // }
            return null;
          })}
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
