import { pgTable, serial, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  message: text("message"),
  origin: varchar("origin", { length: 50 }).default("web"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  goalAmount: varchar("goal_amount", { length: 50 }).notNull().default("0"),
  kmDriven: varchar("km_driven", { length: 50 }).notNull().default("0"),
  fuelCost: varchar("fuel_cost", { length: 50 }).notNull().default("0"),
  otherExpenses: varchar("other_expenses", { length: 50 }).notNull().default("0"),
  grossEarnings: varchar("gross_earnings", { length: 50 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  pro: boolean("pro").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
