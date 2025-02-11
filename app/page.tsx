"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import { QuestionForm } from "@/components/question-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  question: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      is_deleted: z.number(),
      answers: z
        .record(z.string(), z.array(z.object({ label: z.string(), content: z.string() })))
        .optional(),
      correct_answer: z.number().optional(),
    }),
  ),
});
export type QuestionFormSchema = z.infer<typeof formSchema>;
export type QuestionFormType = ReturnType<typeof useForm<QuestionFormSchema>>;

export default function Home() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: [],
    },
  });
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
          <QuestionForm form={form} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
