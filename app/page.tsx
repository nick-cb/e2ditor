"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import { QuestionForm, QuestionFormProvider, useQuestionForm } from "@/components/question-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  question: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      is_deleted: z.number(),
      answers: z.array(
        z.object({ label: z.string().optional(), content: z.string(), is_deleted: z.number() }),
      ),
      correct_answer: z.number().optional(),
      min_answer: z.number().optional(),
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
  const questionForm = useQuestionForm();

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
        <SheetContent className={"!max-w-none w-1/2 p-0 overflow-y-scroll"}>
          <div className={"border-b min-h-10 p-4"}>
            <div
              className={
                "items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-max grid-cols-2 gap-1"
              }
            >
              <Button
                size="sm"
                variant={"outline"}
                className={cn(
                  "hover:bg-background w-20",
                  questionForm.mode === "normal" ? "bg-background" : "bg-muted",
                )}
                onClick={() => questionForm.changeMode('normal')}
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={"outline"}
                className={cn(
                  "hover:bg-background w-20",
                  questionForm.mode === "restore" ? "bg-background" : "bg-muted",
                )}
                onClick={() => questionForm.changeMode('restore')}
              >
                Restore
              </Button>
            </div>
          </div>
          <div className={'p-4'}>
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
            <QuestionFormProvider questionForm={questionForm}>
              <QuestionForm form={form} />
            </QuestionFormProvider>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
