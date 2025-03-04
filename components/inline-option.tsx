import React, { useCallback, useMemo, useState } from "react";
import { InlineBlock, InlineOptionBlock } from "./block";
import { useEditor } from "./editor";

type InlineOptionProps = {
  child: InlineOptionBlock;
  editor: ReturnType<typeof useEditor>
};

export function InlineOption(props: InlineOptionProps) {
  const { child, editor } = props;
  const [option1, option2] = useMemo(() => {
    return Array.from(child.inlineChildren);
  }, [child.inlineChildren]);
  // console.log({ option1, option2, a: Array.from(child.inlineChildren), child });

  const registerBlock = useCallback((option: InlineBlock) => {
    return (current: HTMLDivElement) => {
      option.target = current;
    };
  }, []);

  return (
    <React.Fragment key={child.id}>
      <div className={"inline-option flex items-center"}>
        <div
          ref={editor.registerBlock(option1)}
          contentEditable
          suppressContentEditableWarning
          className={"px-1 min-h-6 bg-red-200"}
        />
      </div>
      <div
        ref={editor.registerBlock(option2)}
        contentEditable
        suppressContentEditableWarning
        className={"px-1 min-h-6 bg-green-200"}
      ></div>
    </React.Fragment>
  );
}
