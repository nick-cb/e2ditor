import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const topic = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  created_at: int({ mode: "timestamp_ms" }),
  updated_at: int({ mode: "timestamp_ms" }),
});

export const tests = sqliteTable("tests", {
  id: int().primaryKey({ autoIncrement: true }),
  topicId: int("topic_id")
    .notNull()
    .references(() => topic.id),
  created_at: int({ mode: "timestamp_ms" }),
  finished_at: int({ mode: "timestamp_ms" }),
  point: int(),
});

export const testDetails = sqliteTable("test_details", {
  id: int().primaryKey({ autoIncrement: true }),
  testId: int("test_id")
    .notNull()
    .references(() => tests.id),
  questionId: int("question_id")
    .notNull()
    .references(() => questions.id),
  answerId: int("answer_id").references(() => answerKeys.id),
  answerText: text(),
});

export const questions = sqliteTable("questions", {
  id: int().primaryKey({ autoIncrement: true }),
  topicId: int("topic_id")
    .notNull()
    .references(() => topic.id),
  type: int().notNull().default(0),
  question: text().notNull(),
});

export const answerKeys = sqliteTable("answer_keys", {
  id: int().primaryKey({ autoIncrement: true }),
  questionId: int("question_id")
    .notNull()
    .references(() => questions.id),
  version: int().notNull().default(0),
  group: int()
    .notNull()
    .references(() => answerGroup.id),
  label: text().notNull(),
  text: text().notNull(),
  isCorrect: int("is_correct"),
});

export const answerGroup = sqliteTable("answer_groups", {
  id: int().primaryKey({ autoIncrement: true }),
});
