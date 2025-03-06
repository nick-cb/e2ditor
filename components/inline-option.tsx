import React, { useCallback, useMemo, useState } from "react";
import { InlineOptionBlock } from "./block";
import { useEditor } from "./editor";

type InlineOptionProps = {
  child: InlineOptionBlock;
  editor: ReturnType<typeof useEditor>;
};

export function InlineOption(props: InlineOptionProps) {
  const { child, editor } = props;
  const [option1, option2] = useMemo(() => {
    return Array.from(child.inlineChildren);
  }, [child.inlineChildren]);
  // console.log({ option1, option2, a: Array.from(child.inlineChildren), child });
  console.log({option1: option1.target,option2: option2.target })
  const isOption1Connected = option1.target?.isConnected;
  const isOption2Connected = option2.target?.isConnected;

  const registerBlock = useCallback((option: InlineOptionBlock) => {
    return (current: HTMLDivElement) => {
      option.target = current;
    };
  }, []);

  return (
    <div ref={registerBlock(child)} className={"flex items-center"}>
      <div className={"inline-option flex items-center"}>
        <div
          ref={editor.registerBlock(option1)}
          contentEditable
          suppressContentEditableWarning
          className={"px-1 min-h-6 bg-red-200"}
        >
          {isOption1Connected ? option1.content : null}
        </div>
      </div>
      <div
        ref={editor.registerBlock(option2)}
        contentEditable
        suppressContentEditableWarning
        className={"px-1 min-h-6 bg-green-200"}
      >
        {isOption2Connected ? option2.content : null}
      </div>
    </div>
  );
}
