import { QuestionSheet } from "@/components/QuestionSheet";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import React from "react";
import { getAllTest, getTestById } from "./actions";
import Link from "next/link";
import { AnswerSheet } from "@/components/answer-sheet";

export default async function Home({ searchParams }: any) {
  const tests = await getAllTest();
  const test = await getTestById(searchParams["testId"]);

  return (
    <div className={"grid grid-cols-8 gap-2 p-3"}>
      <Sheet>
        <SheetTrigger className="aspect-square border-dashed border border-white/60 flex justify-center items-center gap-2">
          <CirclePlusIcon />
          <div>Add New</div>
        </SheetTrigger>
        <QuestionSheet />
      </Sheet>
      {tests.map((test) => {
        return (
          <Link key={test.id} href={`/?testId=${test.id}`}>
            <div className="aspect-square border border-white/60 flex justify-center items-center gap-2">
              {test.name}
            </div>
          </Link>
        );
      })}
      {test ?
        <AnswerSheet test={test} />
      : null}
    </div>
  );
}
