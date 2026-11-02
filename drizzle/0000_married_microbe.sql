CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"neon_auth_user_id" text NOT NULL,
	"name" text,
	"email" text,
	"role" text DEFAULT 'cashier' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_neon_auth_user_id_unique" UNIQUE("neon_auth_user_id")
);
