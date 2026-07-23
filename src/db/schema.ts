import { pgTable, serial, varchar, timestamp, text, boolean, json } from "drizzle-orm/pg-core";

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
  workedMs: varchar("worked_ms", { length: 50 }).notNull().default("0"),
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

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull().unique(),
  workDays: json("work_days").notNull().$type<boolean[]>(),
  hoursPerDay: varchar("hours_per_day", { length: 50 }).notNull().default("8"),
  weeklyGoal: varchar("weekly_goal", { length: 50 }).notNull().default(""),
  vehicle: varchar("vehicle", { length: 20 }).notNull().default("car"),
  financing: varchar("financing", { length: 50 }).notNull().default(""),
  maintenance: varchar("maintenance", { length: 50 }).notNull().default(""),
  insurance: varchar("insurance", { length: 50 }).notNull().default(""),
  otherMonthly: varchar("other_monthly", { length: 50 }).notNull().default(""),
  annualTaxes: varchar("annual_taxes", { length: 50 }).notNull().default(""),
  emergencyFund: varchar("emergency_fund", { length: 50 }).notNull().default(""),
  leisure: varchar("leisure", { length: 50 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
