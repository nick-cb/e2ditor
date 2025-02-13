"use server";

import { db } from "@/drizzle";
import { answerGroup, answerKeys, questions, tests, topics } from "@/drizzle/schema";
import { QuestionFormSchema } from "./page";
import { eq, inArray, sql } from "drizzle-orm";

export async function saveTest(values: QuestionFormSchema) {
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
  db.select().from(tests).leftJoin(questions, eq(tests.id, questions.id)).where(eq(tests.id, id));
}

export async function getAllTest() {
  return db.select().from(tests);
}
