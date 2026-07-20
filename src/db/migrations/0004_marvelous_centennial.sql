CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"work_days" json NOT NULL,
	"hours_per_day" varchar(50) DEFAULT '8' NOT NULL,
	"weekly_goal" varchar(50) DEFAULT '' NOT NULL,
	"vehicle" varchar(20) DEFAULT 'car' NOT NULL,
	"financing" varchar(50) DEFAULT '' NOT NULL,
	"maintenance" varchar(50) DEFAULT '' NOT NULL,
	"insurance" varchar(50) DEFAULT '' NOT NULL,
	"other_monthly" varchar(50) DEFAULT '' NOT NULL,
	"annual_taxes" varchar(50) DEFAULT '' NOT NULL,
	"emergency_fund" varchar(50) DEFAULT '' NOT NULL,
	"leisure" varchar(50) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_email_unique" UNIQUE("user_email")
);
