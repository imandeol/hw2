import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  date: text("date").notNull(),
  cost: real("cost").notNull(),
  deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
});
