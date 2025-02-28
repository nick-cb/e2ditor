import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assert(value: boolean, message?: string): asserts value {
  if (!value) throw new Error(message);
}

