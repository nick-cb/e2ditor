import { QuestionSheet } from "@/components/QuestionSheet";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import React from "react";
import { getAllTest } from "./actions";
import Link from "next/link";

export default async function Home() {
  const tests = await getAllTest();
  console.log(tests);
  return (
    <div className={"grid grid-cols-8 gap-2 p-3"}>
      <Sheet>
        <SheetTrigger className="aspect-square border-dashed border border-white/60 flex justify-center items-center gap-2">
          <CirclePlusIcon />
          <div>Add New</div>
        </SheetTrigger>
        <QuestionSheet />
        {tests.map((test) => {
          return (
            <Link href={`/?${test.id}`}>
              <div className="aspect-square border border-white/60 flex justify-center items-center gap-2">
                {test.name}
              </div>
            </Link>
          );
        })}
      </Sheet>
    </div>
  );
}
