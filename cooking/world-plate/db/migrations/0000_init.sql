CREATE TABLE `cuisines` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`emoji` text NOT NULL,
	`intro` text NOT NULL,
	`image` text NOT NULL,
	`image_alt` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`session_id` text NOT NULL,
	`recipe_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`session_id`, `recipe_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`section` text,
	`amount` real,
	`unit` text,
	`item` text NOT NULL,
	`note` text,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredients_recipe_pos_uq` ON `ingredients` (`recipe_id`,`position`);--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_email_uq` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `ratings` (
	`session_id` text NOT NULL,
	`recipe_id` integer NOT NULL,
	`stars` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`session_id`, `recipe_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ratings_stars_ck" CHECK("ratings"."stars" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `ratings_recipe_idx` ON `ratings` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `recipe_tags` (
	`recipe_id` integer NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`recipe_id`, `tag`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_tags_tag_idx` ON `recipe_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`cuisine_slug` text NOT NULL,
	`origin` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`image_alt` text NOT NULL,
	`prep_minutes` integer NOT NULL,
	`cook_minutes` integer NOT NULL,
	`servings` integer NOT NULL,
	`difficulty` text NOT NULL,
	`vegetarian` integer NOT NULL,
	`trending` integer DEFAULT false NOT NULL,
	`story` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cuisine_slug`) REFERENCES `cuisines`(`slug`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "recipes_servings_ck" CHECK("recipes"."servings" > 0),
	CONSTRAINT "recipes_minutes_ck" CHECK("recipes"."prep_minutes" >= 0 AND "recipes"."cook_minutes" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_uq` ON `recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipes_cuisine_idx` ON `recipes` (`cuisine_slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `steps_recipe_pos_uq` ON `steps` (`recipe_id`,`position`);