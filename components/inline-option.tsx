import React, { useMemo, useState } from "react";
import { InlineBlock, InlineOptionBlock } from "./block";

type InlineOptionProps = {
  child: InlineOptionBlock;
};

export function InlineOption(props: InlineOptionProps) {
  const { child } = props;
  const [option1, option2] = useMemo(() => {
    return Array.from(child.inlineChildren);
  }, [child.inlineChildren]);
  console.log('inline-childrens',Array.from(child.inlineChildren));
  return (
    <React.Fragment key={child.id}>
      <div className={"inline-option flex items-center"}>
        <div
          // ref={editor.registerBlock(child.inlineChildren[0])}
          key={option1.id}
          contentEditable
          suppressContentEditableWarning
          className={"px-1 min-h-6 bg-red-200"}
        />
      </div>
      <div
        // ref={editor.registerBlock(child.inlineChildren[0])}
        key={option2.id}
        contentEditable
        suppressContentEditableWarning
        className={"px-1 min-h-6 bg-green-200"}
      ></div>
    </React.Fragment>
  );
}
