CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"goal_amount" varchar(50) DEFAULT '0' NOT NULL,
	"km_driven" varchar(50) DEFAULT '0' NOT NULL,
	"fuel_cost" varchar(50) DEFAULT '0' NOT NULL,
	"other_expenses" varchar(50) DEFAULT '0' NOT NULL,
	"gross_earnings" varchar(50) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_date" UNIQUE("user_email","date")
);
