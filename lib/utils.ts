import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IBlock, LineBlock, RootBlock } from "@/components/block";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assert(value: boolean, message?: string): asserts value {
  if (!value) throw new Error(message);
}

export function isLineBlock(block: IBlock | RootBlock): block is LineBlock {
  return block.type === "block";
}

export function isRootblock(block: any): block is RootBlock {
  return block.type === "root";
}

export function composeEventHandlers<E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {}
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);

    if (checkForDefaultPrevented === false || !(event as unknown as Event).defaultPrevented) {
      return ourEventHandler?.(event);
    }
  };
}