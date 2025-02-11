"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  CirclePlusIcon,
  RotateCcwIcon,
  RotateCwIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DevTool } from "@hookform/devtools";

const QuestionType = [
  { type: "text", value: "0", label: "Text" },
  { type: "radio", value: "1", label: "Radio" },
  { type: "checkbox", value: "2", label: "Checkbox" },
];

const formSchema = z.object({
  question: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      is_deleted: z.number(),
      answers: z.array(
        z.object({ content: z.string(), is_correct: z.number() }),
      ),
    }),
  ),
});

export default function Home() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: [],
    },
  });
  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: "question",
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className={"flex flex-col gap-4 mb-4"}>
                {fields.map((fieldData, index) => {
                  const isDeleted = fieldData.is_deleted === 1;
                  return (
                    <React.Fragment key={fieldData.id}>
                      <div
                        key={fieldData.id}
                        className={
                          "border-dashed border p-4 flex flex-col gap-3"
                        }
                      >
                        <FormField
                          control={form.control}
                          name={`question.${index}.name`}
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <div className={"flex gap-2 items-center"}>
                                  <FormLabel
                                    className={cn(
                                      isDeleted &&
                                        "line-through italic text-white/60",
                                    )}
                                  >
                                    Question {index + 1}
                                  </FormLabel>
                                  <Button
                                    onClick={() => {
                                      if (isDeleted) {
                                        update(index, {
                                          ...form.getValues().question[index],
                                          is_deleted: 0,
                                        });
                                      } else {
                                        update(index, {
                                          ...form.getValues().question[index],
                                          is_deleted: 1,
                                        });
                                      }
                                    }}
                                    variant={"ghost"}
                                    size={"sm"}
                                  >
                                    {isDeleted ? (
                                      <RotateCcwIcon />
                                    ) : (
                                      <TrashIcon />
                                    )}
                                  </Button>
                                </div>
                                <FormControl>
                                  <Input
                                    placeholder="shadcn"
                                    {...field}
                                    disabled={isDeleted}
                                    className={cn(
                                      isDeleted && "italic line-through",
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormItem>
                          <FormLabel
                            className={cn(
                              isDeleted && "line-through text-white/60 italic",
                            )}
                          >
                            Answer
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name={`question.${index}.type`}
                            render={({ field }) => {
                              return (
                                <RadioGroup
                                  defaultValue={"0"}
                                  onValueChange={field.onChange}
                                  className={"grid-cols-3 w-max"}
                                >
                                  {QuestionType.map((qt) => {
                                    return (
                                      <div
                                        key={qt.type}
                                        className="flex items-center space-x-2"
                                      >
                                        <RadioGroupItem
                                          id={qt.type}
                                          value={qt.value}
                                          disabled={isDeleted}
                                        />
                                        <Label
                                          htmlFor={qt.type}
                                          className={cn(
                                            isDeleted &&
                                              "line-through text-white/60 italic",
                                          )}
                                        >
                                          {qt.label}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </RadioGroup>
                              );
                            }}
                          />
                        </FormItem>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <Button
                type="button"
                onClick={() => {
                  append({ type: "0", name: "", is_deleted: 0, answers: [] });
                }}
              >
                Add Question
              </Button>
            </form>
            <DevTool control={form.control} />
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
