ALTER TABLE "user_settings" ADD COLUMN "schedule_mode" varchar(20) DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "cycle_work_days" varchar(10) DEFAULT '6' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "cycle_rest_days" varchar(10) DEFAULT '1' NOT NULL;