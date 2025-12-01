ALTER TABLE `course` ADD `description` text;--> statement-breakpoint
ALTER TABLE `course` ADD `credits` integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `course` ADD `capacity` integer DEFAULT 30 NOT NULL;