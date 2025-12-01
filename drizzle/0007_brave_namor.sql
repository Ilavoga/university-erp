CREATE TABLE `vehicle_booking` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`route_id` text NOT NULL,
	`pickup_stop_id` text,
	`dropoff_stop_id` text,
	`status` text DEFAULT 'CONFIRMED' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`route_id`) REFERENCES `route`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pickup_stop_id`) REFERENCES `route_stop`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dropoff_stop_id`) REFERENCES `route_stop`(`id`) ON UPDATE no action ON DELETE no action
);
