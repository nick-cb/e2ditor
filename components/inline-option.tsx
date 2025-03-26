import React, { useCallback, useLayoutEffect, useRef } from "react";
import { IBlock, InlineOptionBlock, OptionBlock } from "./block";
import { cn, useComposedRefs } from "@/lib/utils";

type InlineOptionProps = {
  block: InlineOptionBlock;
  registerBlock(block: IBlock): (current: HTMLDivElement) => () => void;
};

export function InlineOption(props: InlineOptionProps) {
  const { block, registerBlock } = props;
  const ref = useCallback((current: HTMLDivElement) => {
    const fn = registerBlock(block);
    fn(current);
  }, []);

  return (
    <div ref={ref} className={"flex items-center"}>
      {Array.from(block.inlineChildren).map((o, i) => {
        return (
          <div key={i} className={cn(i % 2 === 0 ? "inline-option" : "", "flex items-center")}>
            <Option option={o} registerBlock={registerBlock} />
          </div>
        );
      })}
    </div>
  );
}

type OptionProps = {
  option: OptionBlock;
  registerBlock(block: IBlock): (current: HTMLDivElement) => () => void;
};
function Option({ option, registerBlock }: OptionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const registerRef = useCallback((current: HTMLDivElement) => {
    const fn = registerBlock(option);
    fn(current);
  }, []);
  const composedRef = useComposedRefs(ref, registerRef);

  useLayoutEffect(() => {
    if (ref.current && option.content) ref.current.textContent = option.content;
  }, []);

  return (
    <div
      ref={composedRef}
      contentEditable
      suppressContentEditableWarning
      className={"px-1 min-h-6 bg-green-200"}
    ></div>
  );
}
