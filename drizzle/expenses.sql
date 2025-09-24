CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`cost` real NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
