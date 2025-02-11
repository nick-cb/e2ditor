import React from "react";
import { RotateCcwIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { QuestionFormSchema, QuestionFormType } from "@/app/page";

const QuestionType = {
  ["text"]: { value: "0", label: "Text", index: 0 },
  ["radio"]: { value: "1", label: "Radio", index: 1 },
  ["checkbox"]: { value: "2", label: "Checkbox", index: 2 },
};

type QuestionFormProps = {
  form: QuestionFormType;
};
export function QuestionForm(props: QuestionFormProps) {
  const { form } = props;
  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: "question",
  });

  // 2. Define a submit handler.
  function onSubmit(values: QuestionFormSchema) {
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
                <div key={fieldData.id} className={"border-dashed border p-4 flex flex-col gap-3"}>
                  <QuestionName index={index} isDeleted={isDeleted} form={form} update={update} />
                  <Answer index={index} isDeleted={isDeleted} form={form} />
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <Button
          type="button"
          onClick={() => {
            append({
              type: "0",
              name: "",
              is_deleted: 0,
            });
          }}
        >
          Add Question
        </Button>
      </form>
      {/* <DevTool control={form.control} /> */}
    </Form>
  );
}

type QuestionNameProps = {
  index: number;
  isDeleted: boolean;
  form: QuestionFormType;
  update: ReturnType<typeof useFieldArray<QuestionFormSchema>>["update"];
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
              <FormLabel className={cn(isDeleted && "line-through italic text-white/60")}>
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
                {isDeleted ?
                  <RotateCcwIcon />
                : <TrashIcon />}
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

type AnswerProps = {
  index: number;
  isDeleted: boolean;
  form: QuestionFormType;
};
export function Answer(props: AnswerProps) {
  const { index, isDeleted, form } = props;

  return (
    <FormItem>
      <FormLabel className={cn(isDeleted && "line-through text-white/60 italic")}>Answer</FormLabel>
      <FormField
        control={form.control}
        name={`question.${index}.type`}
        render={({ field }) => {
          return (
            <RadioGroup defaultValue={field.value} onValueChange={field.onChange}>
              <div className={"grid grid-cols-3 w-max mb-1"}>
                <QuestionTypeRadio
                  label={QuestionType.text.label}
                  type={QuestionType.text.value}
                  isDeleted={isDeleted}
                />
                <QuestionTypeRadio
                  label={QuestionType.radio.label}
                  type={QuestionType.radio.value}
                  isDeleted={isDeleted}
                />
                <QuestionTypeRadio
                  label={QuestionType.checkbox.label}
                  type={QuestionType.checkbox.value}
                  isDeleted={isDeleted}
                />
              </div>
              <FormItem>
                {field.value === QuestionType.text.value ?
                  <TextAnswer form={form} questionIndex={index} />
                : null}
                {field.value === QuestionType.radio.value ?
                  <RadioAnswer form={form} questionIndex={index} isDeleted={isDeleted} />
                : null}
                {field.value === QuestionType.checkbox.value ?
                  <CheckboxAnswer />
                : null}
              </FormItem>
            </RadioGroup>
          );
        }}
      />
    </FormItem>
  );
}

type QuestionTypeRadioProps = {
  label: string;
  type: string;
  isDeleted: boolean;
};
function QuestionTypeRadio(props: QuestionTypeRadioProps) {
  const { label, type, isDeleted } = props;
  return (
    <div key={type} className="flex items-center space-x-2">
      <RadioGroupItem id={type} value={type} disabled={isDeleted} />
      <Label htmlFor={type} className={cn(isDeleted && "line-through text-white/60 italic")}>
        {label}
      </Label>
    </div>
  );
}

type TextAnswerProps = {
  questionIndex: number;
  form: QuestionFormType;
};
function TextAnswer(props: TextAnswerProps) {
  const { questionIndex, form } = props;
  const questionDeleted = form.getValues().question[questionIndex].is_deleted === 1;
  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: `question.${questionIndex}.answers.${QuestionType.text.value}`,
  });

  return (
    <div>
      {fields.map((f, index) => {
        const isDeleted = f.is_deleted === 1;
        return (
          <div key={f.id} className={"flex items-center gap-4 mb-4"}>
            <FormItem className={"flex-grow"}>
              <FormField
                control={form.control}
                name={`question.${questionIndex}.answers.${QuestionType.text.value}.${index}.content`}
                render={({ field }) => {
                  return (
                    <Input onChange={field.onChange} disabled={questionDeleted || isDeleted} />
                  );
                }}
              />
            </FormItem>
            <Button
              size={"sm"}
              variant={"ghost"}
              onClick={() => {
                const questionAnswers =
                  form.getValues().question[questionIndex].answers?.[QuestionType.text.value];
                if (questionAnswers) {
                  const answer = questionAnswers[index];
                  if (answer.is_deleted === 0) update(index, { ...answer, is_deleted: 1 });
                  if (answer.is_deleted === 1) update(index, { ...answer, is_deleted: 0 });
                }
              }}
              disabled={questionDeleted}
            >
              {isDeleted ?
                <RotateCcwIcon />
              : <TrashIcon />}
            </Button>
          </div>
        );
      })}
      <Button
        size={"sm"}
        onClick={() => {
          append({ content: "", is_deleted: 0 });
        }}
        disabled={questionDeleted}
      >
        Add Answer
      </Button>
    </div>
  );
}

type RadioAnswerProps = {
  questionIndex: number;
  form: QuestionFormType;
  isDeleted: boolean;
};
function RadioAnswer(props: RadioAnswerProps) {
  const { questionIndex, form, isDeleted } = props;
  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: `question.${questionIndex}.answers.${QuestionType.radio.value}`,
  });

  return (
    <div>
      <FormField
        control={form.control}
        name={`question.${questionIndex}.correct_answer`}
        render={({ field }) => {
          return (
            <RadioGroup defaultValue={"0"} onValueChange={field.onChange} className={"mb-4"}>
              {fields.map((f, index) => {
                const isDeleted = f.is_deleted === 1;
                return (
                  <div key={f.id} className={"flex items-center gap-4"}>
                    <div className={"flex items-center gap-4 flex-grow"}>
                      <FormItem>
                        <FormField
                          control={form.control}
                          name={`question.${questionIndex}.answers.${QuestionType.radio.value}.${index}.label`}
                          render={() => {
                            return (
                              <FormLabel
                                suppressContentEditableWarning
                                contentEditable
                                className={cn(
                                  "outline-none w-20",
                                  isDeleted && "italic line-through text-white/60",
                                )}
                              >
                                Answer {index}
                              </FormLabel>
                            );
                          }}
                        />
                      </FormItem>
                      <FormItem className={"flex-grow"}>
                        <FormField
                          control={form.control}
                          name={`question.${questionIndex}.answers.${QuestionType.radio.value}.${index}.content`}
                          render={({ field }) => {
                            return <Input onChange={field.onChange} disabled={isDeleted} />;
                          }}
                        />
                      </FormItem>
                    </div>
                    <RadioGroupItem id={f.id} value={index.toString()} disabled={isDeleted} />
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      onClick={() => {
                        const questionAnswers =
                          form.getValues().question[questionIndex].answers?.[
                            QuestionType.radio.value
                          ];
                        if (questionAnswers) {
                          const answer = questionAnswers[index];
                          if (answer.is_deleted === 0) update(index, { ...answer, is_deleted: 1 });
                          if (answer.is_deleted === 1) update(index, { ...answer, is_deleted: 0 });
                        }
                      }}
                    >
                      {isDeleted ?
                        <RotateCcwIcon />
                      : <TrashIcon />}
                    </Button>
                  </div>
                );
              })}
            </RadioGroup>
          );
        }}
      />
      <Button
        size={"sm"}
        onClick={() => {
          append({ label: "", content: "", is_deleted: 0 });
        }}
      >
        Add Answer
      </Button>
    </div>
  );
}

function CheckboxAnswer() {
  return (
    <Button size={"sm"} onClick={() => {}}>
      Add Answer
    </Button>
  );
}
