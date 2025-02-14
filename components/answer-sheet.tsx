"use client";

import { useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useRouter } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { answerKeys, questions, tests } from "@/drizzle/schema";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionType } from "./question-form";
import { FormField } from "./ui/form";
import { Button } from "./ui/button";

const formSchema = z.object({
  id: z.number(),
  questions: z.array(
    z.object({
      id: z.number(),
      answers: z.array(
        z.object({
          id: z.number().optional(),
          content: z.string().optional(),
        }),
      ),
    }),
  ),
});

type Test = InferSelectModel<typeof tests> & {
  questions: (InferSelectModel<typeof questions> & {
    answers: InferSelectModel<typeof answerKeys>[];
  })[];
};
export function AnswerSheet(
  props: React.PropsWithChildren<{
    test: Test;
  }>,
) {
  const { test } = props;
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: test.id,
      questions: test.questions.map((q) => {
        if (q.type === QuestionType.text.index && q.minAnswer) {
          console.log("fill");
          return {
            answers: new Array(q.minAnswer).fill(undefined).map((_, index) => {
              const answer = q.answers[index];
              if (answer) {
                return { id: answer.id, content: answer.content };
              }
              return { id: index, content: "" };
            }),
          };
        }
        return {
          answers: q.answers.map((a) => {
            return { id: a.id, content: a.content };
          }),
        };
      }),
    },
  });

  return (
    <Sheet
      defaultOpen={!!searchParams.get("testId")}
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <SheetContent className={"!max-w-none w-1/2 overflow-y-scroll p-0"}>
        <div className={"border-b min-h-10 p-4 flex items-center justify-between"}>
          <Button variant={"outline"} type={"submit"} className={"mr-8"}>
            Save
          </Button>
        </div>
        <div className={"p-4"}>
          <SheetHeader className={"my-4"}>
            <SheetTitle>{test.name}</SheetTitle>
          </SheetHeader>
          {test.questions.map((q, index) => {
            if (q.type === 0) {
              return <TextQuestion key={q.id} form={form} question={q} questionIndex={index} />;
            }
            return null;
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TextQuestion(props: {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  question: Test["questions"][number];
  questionIndex: number;
}) {
  const { form, question, questionIndex } = props;

  return (
    <div className={cn("border-dashed border p-4 flex flex-col gap-3")}>
      {question.title}
      {question.minAnswer ?
        new Array(question.minAnswer).fill(undefined).map((_, index) => {
          const answer = form.getValues().questions[questionIndex].answers[index];
          return (
            <FormField
              key={answer.id}
              control={form.control}
              name={`questions.${questionIndex}.answers.${index}.content`}
              render={({ field }) => {
                return <Input key={index} value={field.value} onChange={field.onChange} />;
              }}
            />
          );
        })
      : null}
    </div>
  );
}
