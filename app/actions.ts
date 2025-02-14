"use server";

import { AnswerFormSchema } from "@/components/answer-sheet";
import { QuestionFormSchema } from "@/components/QuestionSheet";
import { db } from "@/drizzle";
import { answerGroup, answerKeys, questions, testDetails, tests, topics } from "@/drizzle/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function createNewTest(values: QuestionFormSchema) {
  let id = values.id;
  if (!id) {
    const insertedTests = await db.insert(tests).values({ name: values.testName }).returning();
    const insertedTest = insertedTests[0];
    id = insertedTest.id;
  }
  const existingTests = await db.select().from(tests).where(eq(tests.id, id));
  const existingTest = existingTests[0];
  for (const question of values.questions) {
    let questionId = question.id;
    if (!questionId) {
      const insertedQuestions = await db
        .insert(questions)
        .values({
          testId: existingTest.id,
          title: question.name,
          type: parseInt(question.type),
          isDeleted: question.isDeleted,
          minAnswer: question.minAnswer,
        })
        .returning();
      const insertedQuestion = insertedQuestions[0];
      questionId = insertedQuestion.id;
    }
    for (const answer of question.answers) {
      if (answer.id) {
        await db
          .update(answerKeys)
          .set({
            content: answer.content,
            label: answer.label,
            version: sql`version+1`,
            isCorrect: answer.isCorerct,
          })
          .where(eq(answerKeys.id, answer.id));
      } else {
        const groups = await db.insert(answerGroup).values({}).returning();
        const group = groups[0];
        await db.insert(answerKeys).values({
          questionId: questionId,
          group: group.id,
          label: answer.label,
          content: answer.content,
          isCorrect: answer.isCorerct,
        });
      }
    }
  }

  return id;
}

export async function getTestById(id: number) {
  if (!id) return null;
  const ts = await db
    .select({
      id: tests.id,
      name: tests.name,
      created_at: tests.created_at,
      finished_at: tests.finished_at,
      point: tests.point,
    })
    .from(tests)
    .where(eq(tests.id, id));
  const test = ts[0];
  const testQuestions = await db.select().from(questions).where(eq(questions.id, test.id));
  const answers = await db
    .select()
    .from(answerKeys)
    .where(
      inArray(
        answerKeys.questionId,
        testQuestions.map((q) => q.id),
      ),
    );

  return {
    ...test,
    questions: testQuestions.map((q) => {
      return {
        ...q,
        answers: answers.filter((a) => a.questionId === q.id),
      };
    }),
  };
}

export async function getAllTest() {
  return db.select().from(tests);
}

export async function saveTestById(values: AnswerFormSchema) {
  const id = values.id;
  for (const question of values.questions) {
    for (const answer of question.answers) {
      await db.update(testDetails).set({
        testId: values.id,
        questionId: question.id,
        answerId: answer.id,
        answerText: answer.content,
      });
    }
  }
}
