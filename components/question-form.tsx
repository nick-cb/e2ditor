import React, { createContext, useContext } from "react";
import { RotateCcwIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
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
  const fieldArray = useFieldArray({
    control: form.control,
    name: "question",
  });
  const { fields, append, update } = fieldArray;

  // 2. Define a submit handler.
  function onSubmit(values: QuestionFormSchema) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldArrayProvider fieldArray={fieldArray}>
          <div className={"flex flex-col gap-4 mb-4"}>
            {fields.map((fieldData, index) => {
              const isDeleted = fieldData.is_deleted === 1;
              return (
                <React.Fragment key={fieldData.id}>
                  <div
                    key={fieldData.id}
                    className={"border-dashed border p-4 flex flex-col gap-3"}
                  >
                    <QuestionName index={index} />
                    <Answer index={index} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </FieldArrayProvider>
        <Button
          type="button"
          onClick={() => {
            append({
              type: "0",
              name: "",
              is_deleted: 0,
              answers: [],
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
};
export function QuestionName(props: QuestionNameProps) {
  const { index } = props;
  const form = useFormContext<QuestionFormSchema>();
  const isQuestionDeleted = form.getValues().question[index].is_deleted === 1;

  return (
    <FormField
      control={form.control}
      name={`question.${index}.name`}
      render={({ field }) => {
        return (
          <FormItem>
            <div className={"flex gap-2 items-center"}>
              <FormLabel className={cn(isQuestionDeleted && "line-through italic text-white/60")}>
                Question {index + 1}
              </FormLabel>
              <RestoreQuestionButton index={index} />
            </div>
            <FormControl>
              <Input
                placeholder="Enter question here"
                {...field}
                disabled={isQuestionDeleted}
                className={cn(isQuestionDeleted && "italic line-through")}
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
};
export function Answer(props: AnswerProps) {
  const { index } = props;
  const form = useFormContext<QuestionFormSchema>();
  const isQuestionDeleted = form.getValues().question[index].is_deleted === 1;

  return (
    <FormItem>
      <FormLabel className={cn(isQuestionDeleted && "line-through text-white/60 italic")}>
        Answer
      </FormLabel>
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
                  isDeleted={isQuestionDeleted}
                />
                <QuestionTypeRadio
                  label={QuestionType.radio.label}
                  type={QuestionType.radio.value}
                  isDeleted={isQuestionDeleted}
                />
                <QuestionTypeRadio
                  label={QuestionType.checkbox.label}
                  type={QuestionType.checkbox.value}
                  isDeleted={isQuestionDeleted}
                />
              </div>
              <FormItem>
                {field.value === QuestionType.text.value ?
                  <TextAnswer form={form} questionIndex={index} />
                : null}
                {field.value === QuestionType.radio.value ?
                  <RadioAnswer form={form} questionIndex={index} />
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
      <FormLabel htmlFor={type} className={cn(isDeleted && "line-through text-white/60 italic")}>
        {label}
      </FormLabel>
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
  const fieldArray = useFieldArray({
    control: form.control,
    name: `question.${questionIndex}.answers`,
  });
  const { fields, append } = fieldArray;

  return (
    <FieldArrayProvider fieldArray={fieldArray}>
      <div>
        {fields.map((f, index) => {
          const isDeleted = f.is_deleted === 1;
          return (
            <div key={f.id} className={"flex items-center gap-4 mb-4"}>
              <FormField
                control={form.control}
                name={`question.${questionIndex}.answers.${index}.content`}
                render={({ field }) => {
                  return (
                    <FormItem className={"flex-grow"}>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        disabled={questionDeleted || isDeleted}
                      />
                    </FormItem>
                  );
                }}
              />
              <RestoreAnswerButton questionIndex={questionIndex} answerIndex={index} />
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
    </FieldArrayProvider>
  );
}

type RadioAnswerProps = {
  questionIndex: number;
  form: QuestionFormType;
};
function RadioAnswer(props: RadioAnswerProps) {
  const { questionIndex, form } = props;
  const questionDeleted = form.getValues().question[questionIndex].is_deleted === 1;
  const fieldArray = useFieldArray({
    control: form.control,
    name: `question.${questionIndex}.answers`,
  });
  const { fields, append, update } = fieldArray;

  return (
    <FieldArrayProvider fieldArray={fieldArray}>
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
                          <AnswerLabel questionIndex={questionIndex} answerIndex={index} />
                        </FormItem>
                        <FormItem className={"flex-grow"}>
                          <FormField
                            control={form.control}
                            name={`question.${questionIndex}.answers.${index}.content`}
                            render={({ field }) => {
                              return (
                                <Input
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={questionDeleted || isDeleted}
                                />
                              );
                            }}
                          />
                        </FormItem>
                      </div>
                      <RadioGroupItem
                        id={f.id}
                        value={index.toString()}
                        disabled={questionDeleted || isDeleted}
                      />
                      <RestoreAnswerButton questionIndex={questionIndex} answerIndex={index} />
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
            append({ label: undefined, content: "", is_deleted: 0 });
          }}
          disabled={questionDeleted}
        >
          Add Answer
        </Button>
      </div>
    </FieldArrayProvider>
  );
}

function CheckboxAnswer() {
  return (
    <Button size={"sm"} onClick={() => {}}>
      Add Answer
    </Button>
  );
}

type RestoreButtonProps = { index: number };
function RestoreQuestionButton(props: RestoreButtonProps) {
  const { index } = props;
  const form = useFormContext<QuestionFormSchema>();
  const isQuestionDeleted = form.getValues().question[index].is_deleted === 1;
  const fieldArray = useFieldArrayContext();
  if (!fieldArray) return null;
  const { update } = fieldArray;

  return (
    <Button
      variant={"ghost"}
      size={"sm"}
      onClick={() => {
        if (isQuestionDeleted) {
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
    >
      {isQuestionDeleted ?
        <RotateCcwIcon />
      : <TrashIcon />}
    </Button>
  );
}

type RestoreAnswerButtonProps = {
  questionIndex: number;
  answerIndex: number;
};
function RestoreAnswerButton(props: RestoreAnswerButtonProps) {
  const { questionIndex, answerIndex } = props;
  const form = useFormContext<QuestionFormSchema>();
  const isQuestionDeleted = form.getValues().question[questionIndex].is_deleted === 1;
  const questionAnswers = form.getValues().question[questionIndex].answers;
  const answer = questionAnswers[answerIndex];
  const fieldArray = useFieldArrayContext();

  if (!answer || !fieldArray) return null;

  const isAnswerDeleted = answer.is_deleted === 1;
  const { update } = fieldArray;

  return (
    <Button
      size={"sm"}
      variant={"ghost"}
      disabled={isQuestionDeleted}
      onClick={() => {
        if (questionAnswers) {
          if (answer.is_deleted === 0) update(answerIndex, { ...answer, is_deleted: 1 });
          if (answer.is_deleted === 1) update(answerIndex, { ...answer, is_deleted: 0 });
        }
      }}
    >
      {isAnswerDeleted ?
        <RotateCcwIcon />
      : <TrashIcon />}
    </Button>
  );
}

const fieldArrayContext = createContext<{
  fieldArray: ReturnType<typeof useFieldArray<QuestionFormSchema>> | null;
}>({ fieldArray: null });
function FieldArrayProvider(
  props: React.PropsWithChildren<{
    fieldArray: ReturnType<typeof useFieldArray<QuestionFormSchema>>;
  }>,
) {
  const { children, fieldArray } = props;
  return <fieldArrayContext.Provider value={{ fieldArray }}>{children}</fieldArrayContext.Provider>;
}

function useFieldArrayContext() {
  return useContext(fieldArrayContext).fieldArray;
}

type AnswerLabelProps = {
  questionIndex: number;
  answerIndex: number;
};
function AnswerLabel(props: AnswerLabelProps) {
  const { questionIndex, answerIndex } = props;
  const form = useFormContext<QuestionFormSchema>();
  const questionDeleted = form.getValues().question[questionIndex].is_deleted === 1;
  const questionAnswers = form.getValues().question[questionIndex].answers;
  const answer = questionAnswers[answerIndex];
  const fieldArray = useFieldArrayContext();
  if (!fieldArray || !answer) return null;

  const isAnswerDeleted = answer.is_deleted === 1;

  return (
    <FormField
      control={form.control}
      name={`question.${questionIndex}.answers.${answerIndex}.label`}
      render={({ field }) => {
        console.log(field.value);
        return (
          <div className={"relative flex items-center"}>
            <FormLabel
              suppressContentEditableWarning
              contentEditable={!questionDeleted && !isAnswerDeleted}
              className={cn(
                "outline-none w-20 min-h-4 pointer-events-auto block",
                (questionDeleted || isAnswerDeleted) && "italic line-through text-white/60",
              )}
              onInput={(event) => field.onChange(event.currentTarget.textContent)}
            >
              {field.value}
            </FormLabel>
            {!field.value ?
              <span className={"text-white/60 pointer-events-none absolute left-0 text-sm"}>
                Enter Label
              </span>
            : null}
          </div>
        );
      }}
    />
  );
}
