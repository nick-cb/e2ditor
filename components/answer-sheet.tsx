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
          return {
            answers: new Array(q.minAnswer).fill(undefined).map(() => {
              return {
                id: undefined,
                content: undefined,
              };
            }),
          };
        }
        return {
          answers: q.answers.map((a) => {
            return {
              id: a.id,
              content: a.content,
            };
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
      <SheetContent className={"!max-w-none w-1/2 overflow-y-scroll"}>
        <SheetHeader className={"my-4"}>
          <SheetTitle>{test.name}</SheetTitle>
        </SheetHeader>
        {test.questions.map((q, index) => {
          if (q.type === 0) {
            return <TextQuestion key={q.id} form={form} question={q} detailIndex={index} />;
          }
          return null;
        })}
      </SheetContent>
    </Sheet>
  );
}

function TextQuestion(props: {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  question: Test["questions"][number];
  detailIndex: number;
}) {
  const { form, question, detailIndex } = props;
  return (
    <div className={cn("border-dashed border p-4 flex flex-col gap-3")}>
      {question.title}
      {question.minAnswer ?
        new Array(question.minAnswer).fill(undefined).map((_, index) => {
          return (
            <FormField
              control={form.control}
              name={`questions.${detailIndex}.answers.${index}.content`}
              render={({ field }) => {
                return <Input key={index} {...field} />;
              }}
            />
          );
        })
      : null}
    </div>
  );
}
