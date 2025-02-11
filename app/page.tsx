"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import { QuestionForm } from "@/components/question-form";

export default function Home() {
  // 1. Define your form.
  return (
    <div className={"grid grid-cols-8 gap-2 p-3"}>
      <Sheet>
        <SheetTrigger
          className={
            "aspect-square border-dashed border border-white/60 flex justify-center items-center gap-2"
          }
        >
          <CirclePlusIcon />
          <div>Add New</div>
        </SheetTrigger>
        <SheetContent className={"!max-w-none w-1/2"}>
          <SheetHeader className={"my-4"}>
            <SheetTitle>
              <div
                contentEditable
                onChange={() => {}}
                suppressContentEditableWarning
                className={"outline-none"}
              >
                Untile Test
              </div>
            </SheetTitle>
          </SheetHeader>
          <QuestionForm />
        </SheetContent>
      </Sheet>
    </div>
  );
}
