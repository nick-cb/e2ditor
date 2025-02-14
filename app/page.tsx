import { Editor, EditorTitle } from "@/components/editor";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import React from "react";

export default async function Home({ searchParams }: any) {
  return (
    <div className={"grid grid-cols-8 gap-2 p-3"}>
      <Sheet>
        <SheetTrigger className="aspect-square border-dashed border border-white/60 flex justify-center items-center gap-2">
          <CirclePlusIcon />
          <div>Add New</div>
        </SheetTrigger>
        <SheetContent className={'!max-w-none w-1/2'}>
          <SheetTitle>
            <EditorTitle />
          </SheetTitle>
          <Editor />
        </SheetContent>
      </Sheet>
    </div>
  );
}
