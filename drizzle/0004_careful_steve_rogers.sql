CREATE TABLE `external_listing` (
	`id` text PRIMARY KEY NOT NULL,
	`landlord_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text NOT NULL,
	`price` integer NOT NULL,
	`images` text,
	`is_available` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`landlord_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hostel_block` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location` text,
	`gender_restriction` text DEFAULT 'MIXED',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `hostel_room` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`room_number` text NOT NULL,
	`capacity` integer DEFAULT 2 NOT NULL,
	`current_occupancy` integer DEFAULT 0 NOT NULL,
	`price_per_semester` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`block_id`) REFERENCES `hostel_block`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `listing_inquiry` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`listing_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listing_id`) REFERENCES `external_listing`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `room_booking` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`room_id` text NOT NULL,
	`semester` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `hostel_room`(`id`) ON UPDATE no action ON DELETE cascade
);
