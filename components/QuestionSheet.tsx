"use client";

import React, { startTransition, useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CirclePlusIcon } from "lucide-react";
import { QuestionForm, QuestionFormProvider, useQuestionForm } from "@/components/question-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createNewTest } from "../app/actions";
import { Form, FormField } from "@/components/ui/form";

const formSchema = z.object({
  id: z.number().optional(),
  testName: z.string(),
  questions: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string(),
      type: z.string(),
      isDeleted: z.number(),
      answers: z.array(
        z.object({
          id: z.number().optional(),
          label: z.string().optional(),
          content: z.string(),
          isDeleted: z.number(),
          isCorerct: z.number().default(0),
        }),
      ),
      correctAnswer: z.number().optional(),
      minAnswer: z.number().optional(),
    }),
  ),
});
export type QuestionFormSchema = z.infer<typeof formSchema>;
export type QuestionFormType = ReturnType<typeof useForm<QuestionFormSchema>>;

export function QuestionSheet() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testName: "Untiled",
      questions: [],
    },
  });
  const questionForm = useQuestionForm();
  function onSubmit(values: QuestionFormSchema) {
    startTransition(async () => {
      const newTest = await createNewTest(values);
    });
  }
  return (
    <>
      <SheetContent className={"!max-w-none w-1/2 p-0 overflow-y-scroll"}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (err) => console.log(err))}>
            <div className={"border-b min-h-10 p-4 flex items-center justify-between"}>
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
                  onClick={() => questionForm.changeMode("normal")}
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
                  onClick={() => questionForm.changeMode("restore")}
                >
                  Restore
                </Button>
              </div>
              <Button variant={"outline"} type={"submit"} className={"mr-8"}>
                Save
              </Button>
            </div>
            <div className={"p-4"}>
              <SheetHeader className={"my-4"}>
                <SheetTitle>
                  <FormField
                    control={form.control}
                    name={"testName"}
                    render={({ field }) => {
                      return <TestName field={field} />;
                    }}
                  />
                </SheetTitle>
              </SheetHeader>
              <QuestionFormProvider questionForm={questionForm}>
                <QuestionForm form={form} />
              </QuestionFormProvider>
            </div>
          </form>
        </Form>
      </SheetContent>
    </>
  );
}

const TestName = React.memo(
  ({ field }: { field: ControllerRenderProps<QuestionFormSchema, "testName"> }) => {
    const [value] = useState(field.value);

    return (
      <div
        contentEditable
        onInput={(event) => field.onChange(event.currentTarget.textContent)}
        suppressContentEditableWarning
        className={"outline-none"}
      >
        {value}
      </div>
    );
  },
);
