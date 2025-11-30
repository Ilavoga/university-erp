CREATE TABLE `route_stop` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`stop_name` text NOT NULL,
	`sequence_order` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `route`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `route` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_point` text NOT NULL,
	`end_point` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicle_status` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`current_stop_id` text,
	`status` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_stop_id`) REFERENCES `route_stop`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicle` (
	`id` text PRIMARY KEY NOT NULL,
	`plate_number` text NOT NULL,
	`capacity` integer NOT NULL,
	`current_route_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`current_route_id`) REFERENCES `route`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_plate_number_unique` ON `vehicle` (`plate_number`);