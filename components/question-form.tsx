import React from "react";
import { RotateCcwIcon, RotateCwIcon, TrashIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
      answers: z
        .object({
          type: z.string(),
          list: z.array(
            z.object({ content: z.string(), is_correct: z.number() }),
          ),
        })
        .optional(),
    }),
  ),
});

export function QuestionForm() {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className={"flex flex-col gap-4 mb-4"}>
          {fields.map((fieldData, index) => {
            const isDeleted = fieldData.is_deleted === 1;
            return (
              <React.Fragment key={fieldData.id}>
                <div
                  key={fieldData.id}
                  className={"border-dashed border p-4 flex flex-col gap-3"}
                >
                  <QuestionName
                    index={index}
                    isDeleted={isDeleted}
                    form={form}
                    update={update}
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
                          >
                            <div className={"grid grid-cols-3 w-max mb-1"}>
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
                            </div>
                            <FormItem>
                              {field.value === "0" ? <Input /> : null}
                              {field.value === "1" ? (
                                <Button onClick={() => {}}>Add Answer</Button>
                              ) : null}
                            </FormItem>
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
            append({ type: "0", name: "", is_deleted: 0 });
          }}
        >
          Add Question
        </Button>
      </form>
      <DevTool control={form.control} />
    </Form>
  );
}

type QuestionNameProps = {
  index: number;
  isDeleted: boolean;
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  update: ReturnType<typeof useFieldArray<z.infer<typeof formSchema>>>['update'];
};
export function QuestionName(props: QuestionNameProps) {
  const { form, index, isDeleted, update } = props;

  return (
    <FormField
      control={form.control}
      name={`question.${index}.name`}
      render={({ field }) => {
        return (
          <FormItem>
            <div className={"flex gap-2 items-center"}>
              <FormLabel
                className={cn(isDeleted && "line-through italic text-white/60")}
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
                {isDeleted ? <RotateCcwIcon /> : <TrashIcon />}
              </Button>
            </div>
            <FormControl>
              <Input
                placeholder="shadcn"
                {...field}
                disabled={isDeleted}
                className={cn(isDeleted && "italic line-through")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
