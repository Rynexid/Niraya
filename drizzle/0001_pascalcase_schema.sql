-- =============================================================================
-- NIRAYA POS — PascalCase schema migration
-- =============================================================================
-- Transforms the legacy lowercase/snake_case business schema into the target
-- PascalCase schema. Existing rows are preserved by renaming tables/columns
-- and adding columns with safe defaults. No business table is dropped or
-- recreated.
--
-- Neon Auth internal tables are untouched. Only NIRAYA's `auth.UserProfiles`
-- is renamed because it is owned by the application, not by Neon Auth.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rename legacy tables to PascalCase
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."categories" RENAME TO "Categories";
ALTER TABLE "niraya"."products" RENAME TO "Products";
ALTER TABLE "niraya"."customers" RENAME TO "Customers";
ALTER TABLE "niraya"."staff" RENAME TO "Staff";
ALTER TABLE "niraya"."settings" RENAME TO "BusinessSettings";
ALTER TABLE "niraya"."transactions" RENAME TO "Transactions";
ALTER TABLE "niraya"."transaction_items" RENAME TO "TransactionItems";
ALTER TABLE "niraya"."stock_movements" RENAME TO "StockMovements";
ALTER TABLE "niraya"."checkout_idempotency" RENAME TO "CheckoutIdempotency";
ALTER TABLE "auth"."user_profiles" RENAME TO "UserProfiles";

-- -----------------------------------------------------------------------------
-- 2. Rename legacy columns to PascalCase
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Categories" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."Categories" RENAME COLUMN "name" TO "Name";
ALTER TABLE "niraya"."Categories" RENAME COLUMN "description" TO "Description";
ALTER TABLE "niraya"."Categories" RENAME COLUMN "status" TO "Status";
ALTER TABLE "niraya"."Categories" RENAME COLUMN "created_at" TO "CreatedAt";

ALTER TABLE "niraya"."Products" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."Products" RENAME COLUMN "name" TO "Name";
ALTER TABLE "niraya"."Products" RENAME COLUMN "sku" TO "Sku";
ALTER TABLE "niraya"."Products" RENAME COLUMN "barcode" TO "Barcode";
ALTER TABLE "niraya"."Products" RENAME COLUMN "category_id" TO "CategoryId";
ALTER TABLE "niraya"."Products" RENAME COLUMN "price" TO "SellingPrice";
ALTER TABLE "niraya"."Products" RENAME COLUMN "cost" TO "CostPrice";
ALTER TABLE "niraya"."Products" RENAME COLUMN "stock" TO "StockQuantity";
ALTER TABLE "niraya"."Products" RENAME COLUMN "min_stock" TO "MinimumStock";
ALTER TABLE "niraya"."Products" RENAME COLUMN "unit" TO "Unit";
ALTER TABLE "niraya"."Products" RENAME COLUMN "image_url" TO "ImageUrl";
ALTER TABLE "niraya"."Products" RENAME COLUMN "status" TO "Status";
ALTER TABLE "niraya"."Products" RENAME COLUMN "created_at" TO "CreatedAt";
ALTER TABLE "niraya"."Products" RENAME COLUMN "updated_at" TO "UpdatedAt";

ALTER TABLE "niraya"."Customers" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."Customers" RENAME COLUMN "name" TO "Name";
ALTER TABLE "niraya"."Customers" RENAME COLUMN "phone" TO "Phone";
ALTER TABLE "niraya"."Customers" RENAME COLUMN "email" TO "Email";
ALTER TABLE "niraya"."Customers" RENAME COLUMN "notes" TO "Notes";
ALTER TABLE "niraya"."Customers" RENAME COLUMN "joined_at" TO "JoinedAt";

ALTER TABLE "niraya"."Staff" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "name" TO "Name";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "email" TO "Email";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "role" TO "Role";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "status" TO "Status";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "joined_at" TO "JoinedAt";
ALTER TABLE "niraya"."Staff" RENAME COLUMN "last_active" TO "LastActive";

ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "business_name" TO "BusinessName";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "address" TO "Address";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "phone" TO "Phone";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "email" TO "Email";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "currency" TO "Currency";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "timezone" TO "Timezone";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "tax_rate" TO "TaxRate";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "member_discount_rate" TO "MemberDiscountRate";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "low_stock_threshold" TO "LowStockThreshold";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "receipt_footer" TO "LegacyReceiptFooter";
ALTER TABLE "niraya"."BusinessSettings" RENAME COLUMN "updated_at" TO "UpdatedAt";

ALTER TABLE "niraya"."Transactions" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "number" TO "TransactionNumber";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "cashier_id" TO "CashierId";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "cashier_name" TO "CashierName";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "customer_id" TO "CustomerId";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "customer_name" TO "CustomerName";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "order_type" TO "OrderType";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "table_number" TO "TableNumber";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "payment_method" TO "PaymentMethod";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "subtotal" TO "Subtotal";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "discount" TO "DiscountTotal";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "tax" TO "TaxTotal";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "total" TO "GrandTotal";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "amount_paid" TO "AmountPaid";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "change_amount" TO "ChangeAmount";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "status" TO "Status";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "void_reason" TO "VoidReason";
ALTER TABLE "niraya"."Transactions" RENAME COLUMN "created_at" TO "CreatedAt";

ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "transaction_id" TO "TransactionId";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "product_id" TO "ProductId";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "name" TO "ProductName";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "sku" TO "Sku";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "quantity" TO "Quantity";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "unit_price" TO "UnitPrice";
ALTER TABLE "niraya"."TransactionItems" RENAME COLUMN "line_total" TO "LineTotal";

ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "id" TO "Id";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "product_id" TO "ProductId";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "product_name" TO "ProductName";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "type" TO "MovementType";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "quantity" TO "Quantity";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "stock_after" TO "StockAfter";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "note" TO "Note";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "staff" TO "StaffName";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "reference_id" TO "ReferenceId";
ALTER TABLE "niraya"."StockMovements" RENAME COLUMN "created_at" TO "CreatedAt";

ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "key" TO "Key";
ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "request_hash" TO "RequestHash";
ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "transaction_id" TO "TransactionId";
ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "response" TO "Response";
ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "created_at" TO "CreatedAt";
ALTER TABLE "niraya"."CheckoutIdempotency" RENAME COLUMN "expires_at" TO "ExpiresAt";

ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "id" TO "Id";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "neon_auth_user_id" TO "UserId";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "name" TO "Name";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "email" TO "Email";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "role" TO "Role";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "created_at" TO "CreatedAt";
ALTER TABLE "auth"."UserProfiles" RENAME COLUMN "updated_at" TO "UpdatedAt";

-- -----------------------------------------------------------------------------
-- 3. Add target columns to renamed tables
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Categories"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "ParentCategoryId" text,
  ADD COLUMN "SortOrder" integer NOT NULL DEFAULT 0,
  ADD COLUMN "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN "DeletedAt" timestamp with time zone;

ALTER TABLE "niraya"."Products"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "Description" text,
  ADD COLUMN "IsTaxable" boolean NOT NULL DEFAULT true,
  ADD COLUMN "IsStockTracked" boolean NOT NULL DEFAULT true,
  ADD COLUMN "ArchivedAt" timestamp with time zone,
  ADD COLUMN "DeletedAt" timestamp with time zone;

ALTER TABLE "niraya"."Customers"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "LoyaltyPoints" integer NOT NULL DEFAULT 0,
  ADD COLUMN "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN "DeletedAt" timestamp with time zone;

ALTER TABLE "niraya"."Staff"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "StoreId" uuid,
  ADD COLUMN "UserId" text,
  ADD COLUMN "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN "DeletedAt" timestamp with time zone;

ALTER TABLE "niraya"."BusinessSettings"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE "niraya"."Transactions"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "StoreId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002',
  ADD COLUMN "StaffId" text,
  ADD COLUMN "PaymentStatus" text NOT NULL DEFAULT 'paid',
  ADD COLUMN "TaxRateId" uuid,
  ADD COLUMN "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE "niraya"."TransactionItems"
  ADD COLUMN "ProductVariantId" uuid,
  ADD COLUMN "DiscountTotal" numeric(14, 2) NOT NULL DEFAULT '0',
  ADD COLUMN "TaxTotal" numeric(14, 2) NOT NULL DEFAULT '0',
  ADD COLUMN "CostPrice" numeric(14, 2) NOT NULL DEFAULT '0',
  ADD COLUMN "Notes" text,
  ADD COLUMN "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE "niraya"."StockMovements"
  ADD COLUMN "BusinessId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN "StoreId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002',
  ADD COLUMN "UnitCost" numeric(14, 2),
  ADD COLUMN "StaffId" text,
  ADD COLUMN "ReferenceType" text;

ALTER TABLE "niraya"."StockMovements" ALTER COLUMN "ProductId" DROP NOT NULL;

ALTER TABLE "auth"."UserProfiles" ADD COLUMN "DeletedAt" timestamp with time zone;

-- -----------------------------------------------------------------------------
-- 4. Widen money/rate columns and normalize timestamps
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Products"
  ALTER COLUMN "SellingPrice" TYPE numeric(14, 2),
  ALTER COLUMN "CostPrice" TYPE numeric(14, 2);

ALTER TABLE "niraya"."Transactions"
  ALTER COLUMN "Subtotal" TYPE numeric(14, 2),
  ALTER COLUMN "DiscountTotal" TYPE numeric(14, 2),
  ALTER COLUMN "TaxTotal" TYPE numeric(14, 2),
  ALTER COLUMN "GrandTotal" TYPE numeric(14, 2),
  ALTER COLUMN "AmountPaid" TYPE numeric(14, 2),
  ALTER COLUMN "ChangeAmount" TYPE numeric(14, 2);

ALTER TABLE "niraya"."TransactionItems"
  ALTER COLUMN "UnitPrice" TYPE numeric(14, 2),
  ALTER COLUMN "LineTotal" TYPE numeric(14, 2);

ALTER TABLE "niraya"."BusinessSettings"
  ALTER COLUMN "TaxRate" TYPE numeric(5, 4),
  ALTER COLUMN "MemberDiscountRate" TYPE numeric(5, 4);

ALTER TABLE "auth"."UserProfiles"
  ALTER COLUMN "CreatedAt" TYPE timestamp with time zone USING "CreatedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "UpdatedAt" TYPE timestamp with time zone USING "UpdatedAt" AT TIME ZONE 'UTC';

-- -----------------------------------------------------------------------------
-- 5. Drop legacy constraints that are replaced by target constraints
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Products" DROP CONSTRAINT IF EXISTS "products_sku_unique";
ALTER TABLE "niraya"."Staff" DROP CONSTRAINT IF EXISTS "staff_email_unique";
ALTER TABLE "niraya"."Transactions" DROP CONSTRAINT IF EXISTS "transactions_number_unique";
ALTER TABLE "auth"."UserProfiles" DROP CONSTRAINT IF EXISTS "user_profiles_neon_auth_user_id_unique";
ALTER TABLE "niraya"."TransactionItems" DROP CONSTRAINT IF EXISTS "transaction_items_transaction_id_transactions_id_fk";
CREATE TABLE "niraya"."AuditLogs" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"UserId" text,
	"Action" text NOT NULL,
	"EntityType" text NOT NULL,
	"EntityId" text,
	"OldValues" jsonb,
	"NewValues" jsonb,
	"IpAddress" text,
	"UserAgent" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "niraya"."FileAttachments" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"EntityType" text NOT NULL,
	"EntityId" text NOT NULL,
	"FileName" text NOT NULL,
	"MimeType" text NOT NULL,
	"SizeBytes" bigint DEFAULT 0 NOT NULL,
	"StorageProvider" text DEFAULT 'neon' NOT NULL,
	"StorageKey" text NOT NULL,
	"Url" text,
	"UploadedByUserId" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "niraya"."Notifications" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"UserId" text,
	"Type" text NOT NULL,
	"Title" text NOT NULL,
	"Body" text NOT NULL,
	"ReadAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "niraya"."BusinessMembers" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid NOT NULL,
	"UserId" text NOT NULL,
	"Role" text DEFAULT 'user' NOT NULL,
	"StoreId" uuid,
	"Status" text DEFAULT 'active' NOT NULL,
	"InvitedAt" timestamp with time zone,
	"JoinedAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"DeletedAt" timestamp with time zone,
	CONSTRAINT "BusinessMembers_BusinessId_UserId_key" UNIQUE("BusinessId","UserId"),
	CONSTRAINT "BusinessMembers_Status_check" CHECK ("niraya"."BusinessMembers"."Status" in ('invited', 'active', 'suspended', 'removed'))
);

CREATE TABLE "niraya"."Businesses" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"Name" text NOT NULL,
	"Slug" text NOT NULL,
	"LegalName" text,
	"TaxId" text,
	"Currency" text DEFAULT 'IDR' NOT NULL,
	"Timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"OwnerUserId" text,
	"Status" text DEFAULT 'active' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"DeletedAt" timestamp with time zone,
	CONSTRAINT "Businesses_Slug_key" UNIQUE("Slug"),
	CONSTRAINT "Businesses_Status_check" CHECK ("niraya"."Businesses"."Status" in ('active', 'suspended', 'archived'))
);

CREATE TABLE "niraya"."Permissions" (
	"Code" text PRIMARY KEY NOT NULL,
	"Name" text NOT NULL,
	"Description" text,
	"Module" text NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Permissions_Name_key" UNIQUE("Name")
);

CREATE TABLE "niraya"."RolePermissions" (
	"RoleCode" text NOT NULL,
	"PermissionCode" text NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "RolePermissions_pkey" PRIMARY KEY("RoleCode","PermissionCode")
);

CREATE TABLE "niraya"."Roles" (
	"Code" text PRIMARY KEY NOT NULL,
	"Name" text NOT NULL,
	"Description" text,
	"Rank" integer DEFAULT 0 NOT NULL,
	"IsSystem" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Roles_Name_key" UNIQUE("Name"),
	CONSTRAINT "Roles_Rank_check" CHECK ("niraya"."Roles"."Rank" >= 0)
);

CREATE TABLE "niraya"."Stores" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid NOT NULL,
	"Name" text NOT NULL,
	"Code" text NOT NULL,
	"Address" text,
	"Phone" text,
	"Email" text,
	"Timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"DeletedAt" timestamp with time zone,
	CONSTRAINT "Stores_BusinessId_Code_key" UNIQUE("BusinessId","Code")
);

CREATE TABLE "niraya"."CustomerAddresses" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"CustomerId" text NOT NULL,
	"Label" text DEFAULT 'Utama' NOT NULL,
	"RecipientName" text,
	"Phone" text,
	"AddressLine1" text NOT NULL,
	"AddressLine2" text,
	"City" text,
	"Province" text,
	"PostalCode" text,
	"Country" text DEFAULT 'Indonesia' NOT NULL,
	"IsPrimary" boolean DEFAULT false NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "niraya"."ProductBarcodes" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ProductId" text NOT NULL,
	"Barcode" text NOT NULL,
	"IsPrimary" boolean DEFAULT false NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ProductBarcodes_Barcode_key" UNIQUE("Barcode")
);

CREATE TABLE "niraya"."ProductPrices" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ProductId" text NOT NULL,
	"StoreId" uuid,
	"PriceType" text DEFAULT 'retail' NOT NULL,
	"SellingPrice" numeric(14, 2) DEFAULT '0' NOT NULL,
	"CostPrice" numeric(14, 2) DEFAULT '0' NOT NULL,
	"StartsAt" timestamp with time zone,
	"EndsAt" timestamp with time zone,
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ProductPrices_PriceType_check" CHECK ("niraya"."ProductPrices"."PriceType" in ('retail', 'wholesale', 'member')),
	CONSTRAINT "ProductPrices_SellingPrice_check" CHECK ("niraya"."ProductPrices"."SellingPrice" >= 0),
	CONSTRAINT "ProductPrices_CostPrice_check" CHECK ("niraya"."ProductPrices"."CostPrice" >= 0)
);

CREATE TABLE "niraya"."ProductUnits" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ProductId" text NOT NULL,
	"Name" text NOT NULL,
	"Abbreviation" text NOT NULL,
	"ConversionFactor" numeric(12, 4) DEFAULT '1' NOT NULL,
	"IsBase" boolean DEFAULT false NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ProductUnits_ProductId_Name_key" UNIQUE("ProductId","Name"),
	CONSTRAINT "ProductUnits_ConversionFactor_check" CHECK ("niraya"."ProductUnits"."ConversionFactor" > 0)
);

CREATE TABLE "niraya"."ProductVariants" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"ProductId" text NOT NULL,
	"Name" text NOT NULL,
	"Sku" text NOT NULL,
	"Barcode" text,
	"SellingPrice" numeric(14, 2),
	"CostPrice" numeric(14, 2),
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ProductVariants_BusinessId_Sku_key" UNIQUE("BusinessId","Sku")
);

CREATE TABLE "niraya"."Inventory" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid DEFAULT '00000000-0000-0000-0000-000000000002' NOT NULL,
	"ProductId" text NOT NULL,
	"StockQuantity" integer DEFAULT 0 NOT NULL,
	"ReservedQuantity" integer DEFAULT 0 NOT NULL,
	"MinimumStock" integer DEFAULT 0 NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Inventory_ProductId_StoreId_key" UNIQUE("ProductId","StoreId"),
	CONSTRAINT "Inventory_StockQuantity_check" CHECK ("niraya"."Inventory"."StockQuantity" >= 0),
	CONSTRAINT "Inventory_ReservedQuantity_check" CHECK ("niraya"."Inventory"."ReservedQuantity" >= 0),
	CONSTRAINT "Inventory_MinimumStock_check" CHECK ("niraya"."Inventory"."MinimumStock" >= 0)
);

CREATE TABLE "niraya"."StockAdjustments" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid DEFAULT '00000000-0000-0000-0000-000000000002' NOT NULL,
	"ProductId" text NOT NULL,
	"AdjustmentType" text NOT NULL,
	"Quantity" integer NOT NULL,
	"Reason" text NOT NULL,
	"Notes" text,
	"AdjustedByUserId" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "StockAdjustments_Quantity_check" CHECK ("niraya"."StockAdjustments"."Quantity" >= 0),
	CONSTRAINT "StockAdjustments_AdjustmentType_check" CHECK ("niraya"."StockAdjustments"."AdjustmentType" in ('increase', 'decrease', 'set'))
);

CREATE TABLE "niraya"."Discounts" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"Name" text NOT NULL,
	"Code" text NOT NULL,
	"Type" text DEFAULT 'fixed' NOT NULL,
	"Value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"IsActive" boolean DEFAULT true NOT NULL,
	"StartsAt" timestamp with time zone,
	"EndsAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Discounts_BusinessId_Code_key" UNIQUE("BusinessId","Code"),
	CONSTRAINT "Discounts_Type_check" CHECK ("niraya"."Discounts"."Type" in ('percentage', 'fixed')),
	CONSTRAINT "Discounts_Value_check" CHECK ("niraya"."Discounts"."Value" >= 0),
	CONSTRAINT "Discounts_PercentageValue_check" CHECK ("niraya"."Discounts"."Type" <> 'percentage' or "niraya"."Discounts"."Value" <= 100)
);

CREATE TABLE "niraya"."PaymentMethods" (
	"Code" text PRIMARY KEY NOT NULL,
	"Name" text NOT NULL,
	"IsActive" boolean DEFAULT true NOT NULL,
	"RequiresReference" boolean DEFAULT false NOT NULL,
	"SortOrder" integer DEFAULT 0 NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "niraya"."TaxRates" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"Name" text NOT NULL,
	"Rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"IsDefault" boolean DEFAULT false NOT NULL,
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "TaxRates_BusinessId_Name_key" UNIQUE("BusinessId","Name"),
	CONSTRAINT "TaxRates_Rate_check" CHECK ("niraya"."TaxRates"."Rate" >= 0 and "niraya"."TaxRates"."Rate" <= 1)
);

CREATE TABLE "niraya"."CashMovements" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"SessionId" uuid NOT NULL,
	"MovementType" text NOT NULL,
	"Amount" numeric(14, 2) NOT NULL,
	"Reason" text NOT NULL,
	"StaffId" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "CashMovements_MovementType_check" CHECK ("niraya"."CashMovements"."MovementType" in ('in', 'out')),
	CONSTRAINT "CashMovements_Amount_check" CHECK ("niraya"."CashMovements"."Amount" >= 0)
);

CREATE TABLE "niraya"."CashRegisterSessions" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"CashRegisterId" uuid NOT NULL,
	"StoreId" uuid NOT NULL,
	"OpenedByStaffId" text NOT NULL,
	"ClosedByStaffId" text,
	"OpeningBalance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ClosingBalance" numeric(14, 2),
	"ExpectedBalance" numeric(14, 2),
	"Difference" numeric(14, 2),
	"Status" text DEFAULT 'open' NOT NULL,
	"OpenedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"ClosedAt" timestamp with time zone,
	"Notes" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "CashRegisterSessions_Status_check" CHECK ("niraya"."CashRegisterSessions"."Status" in ('open', 'closed', 'voided')),
	CONSTRAINT "CashRegisterSessions_OpeningBalance_check" CHECK ("niraya"."CashRegisterSessions"."OpeningBalance" >= 0)
);

CREATE TABLE "niraya"."CashRegisters" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid NOT NULL,
	"Name" text NOT NULL,
	"Code" text NOT NULL,
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "CashRegisters_StoreId_Code_key" UNIQUE("StoreId","Code")
);

CREATE TABLE "niraya"."Shifts" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid NOT NULL,
	"StaffId" text NOT NULL,
	"StartTime" timestamp with time zone NOT NULL,
	"EndTime" timestamp with time zone,
	"Status" text DEFAULT 'scheduled' NOT NULL,
	"Notes" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Shifts_Status_check" CHECK ("niraya"."Shifts"."Status" in ('scheduled', 'active', 'completed', 'cancelled'))
);

CREATE TABLE "niraya"."Suppliers" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"Name" text NOT NULL,
	"ContactName" text,
	"Phone" text,
	"Email" text,
	"Address" text,
	"TaxId" text,
	"Notes" text,
	"Status" text DEFAULT 'active' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"DeletedAt" timestamp with time zone,
	CONSTRAINT "Suppliers_Status_check" CHECK ("niraya"."Suppliers"."Status" in ('active', 'inactive', 'archived'))
);

CREATE TABLE "niraya"."GoodsReceiptItems" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"GoodsReceiptId" uuid NOT NULL,
	"PurchaseOrderItemId" uuid NOT NULL,
	"ProductId" text NOT NULL,
	"QuantityReceived" integer NOT NULL,
	"UnitCost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "GoodsReceiptItems_QuantityReceived_check" CHECK ("niraya"."GoodsReceiptItems"."QuantityReceived" > 0),
	CONSTRAINT "GoodsReceiptItems_UnitCost_check" CHECK ("niraya"."GoodsReceiptItems"."UnitCost" >= 0)
);

CREATE TABLE "niraya"."GoodsReceipts" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"PurchaseOrderId" uuid NOT NULL,
	"ReceiptNumber" text NOT NULL,
	"ReceivedByUserId" text,
	"ReceivedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"Notes" text,
	"Status" text DEFAULT 'received' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "GoodsReceipts_ReceiptNumber_key" UNIQUE("ReceiptNumber"),
	CONSTRAINT "GoodsReceipts_Status_check" CHECK ("niraya"."GoodsReceipts"."Status" in ('draft', 'received', 'voided'))
);

CREATE TABLE "niraya"."PurchaseOrderItems" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"PurchaseOrderId" uuid NOT NULL,
	"ProductId" text NOT NULL,
	"ProductName" text NOT NULL,
	"Sku" text,
	"QuantityOrdered" integer NOT NULL,
	"QuantityReceived" integer DEFAULT 0 NOT NULL,
	"UnitCost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"LineTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PurchaseOrderItems_QuantityOrdered_check" CHECK ("niraya"."PurchaseOrderItems"."QuantityOrdered" > 0),
	CONSTRAINT "PurchaseOrderItems_QuantityReceived_check" CHECK ("niraya"."PurchaseOrderItems"."QuantityReceived" >= 0),
	CONSTRAINT "PurchaseOrderItems_UnitCost_check" CHECK ("niraya"."PurchaseOrderItems"."UnitCost" >= 0),
	CONSTRAINT "PurchaseOrderItems_LineTotal_check" CHECK ("niraya"."PurchaseOrderItems"."LineTotal" >= 0)
);

CREATE TABLE "niraya"."PurchaseOrders" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid NOT NULL,
	"SupplierId" uuid NOT NULL,
	"OrderNumber" text NOT NULL,
	"Status" text DEFAULT 'draft' NOT NULL,
	"OrderDate" timestamp with time zone DEFAULT now() NOT NULL,
	"ExpectedDate" timestamp with time zone,
	"Subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"TaxTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"GrandTotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"Notes" text,
	"CreatedByUserId" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PurchaseOrders_OrderNumber_key" UNIQUE("OrderNumber"),
	CONSTRAINT "PurchaseOrders_Status_check" CHECK ("niraya"."PurchaseOrders"."Status" in ('draft', 'ordered', 'partial', 'received', 'cancelled')),
	CONSTRAINT "PurchaseOrders_Subtotal_check" CHECK ("niraya"."PurchaseOrders"."Subtotal" >= 0),
	CONSTRAINT "PurchaseOrders_TaxTotal_check" CHECK ("niraya"."PurchaseOrders"."TaxTotal" >= 0),
	CONSTRAINT "PurchaseOrders_GrandTotal_check" CHECK ("niraya"."PurchaseOrders"."GrandTotal" >= 0)
);

CREATE TABLE "niraya"."Payments" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"TransactionId" text NOT NULL,
	"PaymentMethod" text NOT NULL,
	"Amount" numeric(14, 2) NOT NULL,
	"ReferenceNumber" text,
	"Status" text DEFAULT 'completed' NOT NULL,
	"PaidAt" timestamp with time zone DEFAULT now() NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Payments_Amount_check" CHECK ("niraya"."Payments"."Amount" >= 0),
	CONSTRAINT "Payments_Status_check" CHECK ("niraya"."Payments"."Status" in ('pending', 'completed', 'failed', 'refunded'))
);

CREATE TABLE "niraya"."TransactionDiscounts" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"TransactionId" text NOT NULL,
	"DiscountId" uuid,
	"Name" text NOT NULL,
	"Type" text DEFAULT 'fixed' NOT NULL,
	"Value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"Amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "TransactionDiscounts_Type_check" CHECK ("niraya"."TransactionDiscounts"."Type" in ('percentage', 'fixed')),
	CONSTRAINT "TransactionDiscounts_Value_check" CHECK ("niraya"."TransactionDiscounts"."Value" >= 0),
	CONSTRAINT "TransactionDiscounts_Amount_check" CHECK ("niraya"."TransactionDiscounts"."Amount" >= 0)
);

CREATE TABLE "niraya"."TransactionRefundItems" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"RefundId" uuid NOT NULL,
	"TransactionItemId" text NOT NULL,
	"ProductId" text NOT NULL,
	"Quantity" integer NOT NULL,
	"UnitPrice" numeric(14, 2) NOT NULL,
	"LineTotal" numeric(14, 2) NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "TransactionRefundItems_Quantity_check" CHECK ("niraya"."TransactionRefundItems"."Quantity" > 0),
	CONSTRAINT "TransactionRefundItems_UnitPrice_check" CHECK ("niraya"."TransactionRefundItems"."UnitPrice" >= 0),
	CONSTRAINT "TransactionRefundItems_LineTotal_check" CHECK ("niraya"."TransactionRefundItems"."LineTotal" >= 0)
);

CREATE TABLE "niraya"."TransactionRefunds" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"TransactionId" text NOT NULL,
	"RefundNumber" text NOT NULL,
	"Amount" numeric(14, 2) NOT NULL,
	"Reason" text NOT NULL,
	"Status" text DEFAULT 'completed' NOT NULL,
	"RefundedByUserId" text,
	"RefundedAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "TransactionRefunds_RefundNumber_key" UNIQUE("RefundNumber"),
	CONSTRAINT "TransactionRefunds_Amount_check" CHECK ("niraya"."TransactionRefunds"."Amount" >= 0),
	CONSTRAINT "TransactionRefunds_Status_check" CHECK ("niraya"."TransactionRefunds"."Status" in ('pending', 'completed', 'rejected'))
);

CREATE TABLE "niraya"."ReceiptSettings" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid,
	"Header" text DEFAULT '' NOT NULL,
	"Footer" text DEFAULT '' NOT NULL,
	"ShowTax" boolean DEFAULT true NOT NULL,
	"ShowCashier" boolean DEFAULT true NOT NULL,
	"PaperWidth" integer DEFAULT 58 NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ReceiptSettings_PaperWidth_check" CHECK ("niraya"."ReceiptSettings"."PaperWidth" in (58, 80))
);

CREATE TABLE "niraya"."StoreSettings" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"BusinessId" uuid DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"StoreId" uuid NOT NULL,
	"LowStockThreshold" integer,
	"TaxRate" numeric(5, 4),
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "StoreSettings_StoreId_key" UNIQUE("StoreId"),
	CONSTRAINT "StoreSettings_TaxRate_check" CHECK ("niraya"."StoreSettings"."TaxRate" is null or ("niraya"."StoreSettings"."TaxRate" >= 0 and "niraya"."StoreSettings"."TaxRate" <= 1)),
	CONSTRAINT "StoreSettings_LowStockThreshold_check" CHECK ("niraya"."StoreSettings"."LowStockThreshold" is null or "niraya"."StoreSettings"."LowStockThreshold" >= 0)
);
-- -----------------------------------------------------------------------------
-- 6. Seed the minimum master data required by foreign keys
-- -----------------------------------------------------------------------------
-- The migration intentionally seeds only structural master data (business,
-- store, roles, permissions, payment methods, tax rate, settings). Demo
-- products/customers/transactions are NOT seeded here.

INSERT INTO "niraya"."Businesses"
  ("Id", "Name", "Slug", "LegalName", "Currency", "Timezone", "Status")
SELECT
  '00000000-0000-0000-0000-000000000001',
  COALESCE(s."BusinessName", 'Niraya Coffee & Bakery'),
  'niraya',
  COALESCE(s."BusinessName", 'Niraya Coffee & Bakery'),
  COALESCE(s."Currency", 'IDR'),
  COALESCE(s."Timezone", 'Asia/Jakarta'),
  'active'
FROM (SELECT 1) AS seed
LEFT JOIN "niraya"."BusinessSettings" s ON s."Id" = 'default'
ON CONFLICT ("Id") DO NOTHING;

UPDATE "niraya"."Businesses" b
SET
  "Name" = s."BusinessName",
  "LegalName" = s."BusinessName",
  "Currency" = s."Currency",
  "Timezone" = s."Timezone",
  "UpdatedAt" = now()
FROM "niraya"."BusinessSettings" s
WHERE b."Id" = '00000000-0000-0000-0000-000000000001'
  AND s."Id" = 'default';

INSERT INTO "niraya"."Stores"
  ("Id", "BusinessId", "Name", "Code", "Address", "Phone", "Email", "Timezone", "IsActive")
SELECT
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Toko Utama',
  'MAIN',
  COALESCE(s."Address", ''),
  COALESCE(s."Phone", ''),
  COALESCE(s."Email", ''),
  COALESCE(s."Timezone", 'Asia/Jakarta'),
  true
FROM (SELECT 1) AS seed
LEFT JOIN "niraya"."BusinessSettings" s ON s."Id" = 'default'
ON CONFLICT ("Id") DO NOTHING;

UPDATE "niraya"."Stores" st
SET
  "Address" = s."Address",
  "Phone" = s."Phone",
  "Email" = s."Email",
  "Timezone" = s."Timezone",
  "UpdatedAt" = now()
FROM "niraya"."BusinessSettings" s
WHERE st."Id" = '00000000-0000-0000-0000-000000000002'
  AND s."Id" = 'default';

INSERT INTO "niraya"."Roles" ("Code", "Name", "Description", "Rank", "IsSystem")
VALUES
  ('user', 'User', 'Akun dasar', 0, true),
  ('cashier', 'Cashier', 'Operasional kasir', 1, true),
  ('manager', 'Manager', 'Operasional toko', 2, true),
  ('admin', 'Admin', 'Administrasi bisnis', 3, true),
  ('owner', 'Owner', 'Pemilik bisnis', 4, true)
ON CONFLICT ("Code") DO NOTHING;

INSERT INTO "niraya"."Permissions" ("Code", "Name", "Description", "Module")
VALUES
  ('category.create', 'Buat kategori', 'Buat kategori', 'categories'),
  ('category.update', 'Ubah kategori', 'Ubah kategori', 'categories'),
  ('category.delete', 'Hapus kategori', 'Hapus kategori', 'categories'),
  ('product.create', 'Buat produk', 'Buat produk', 'products'),
  ('product.update', 'Ubah produk', 'Ubah produk', 'products'),
  ('product.status', 'Ubah status produk', 'Ubah status produk', 'products'),
  ('product.delete', 'Hapus produk', 'Hapus produk', 'products'),
  ('customer.create', 'Buat pelanggan', 'Buat pelanggan', 'customers'),
  ('customer.update', 'Ubah pelanggan', 'Ubah pelanggan', 'customers'),
  ('customer.delete', 'Hapus pelanggan', 'Hapus pelanggan', 'customers'),
  ('staff.create', 'Buat staf', 'Buat staf', 'staff'),
  ('staff.update', 'Ubah staf', 'Ubah staf', 'staff'),
  ('staff.delete', 'Hapus staf', 'Hapus staf', 'staff'),
  ('stock.adjust', 'Sesuaikan stok', 'Sesuaikan stok', 'inventory'),
  ('transaction.void', 'Batalkan transaksi', 'Batalkan transaksi', 'transactions'),
  ('settings.update', 'Ubah pengaturan', 'Ubah pengaturan', 'settings')
ON CONFLICT ("Code") DO NOTHING;

INSERT INTO "niraya"."RolePermissions" ("RoleCode", "PermissionCode")
SELECT r."Code", p."Code"
FROM "niraya"."Roles" r
CROSS JOIN "niraya"."Permissions" p
WHERE
  r."Code" = 'owner'
  OR (r."Code" = 'admin' AND p."Code" <> 'staff.delete')
  OR (
    r."Code" = 'manager'
    AND p."Code" NOT IN (
      'category.delete',
      'product.delete',
      'customer.delete',
      'staff.delete',
      'staff.create',
      'staff.update',
      'settings.update'
    )
  )
  OR (r."Code" = 'cashier' AND p."Code" = 'stock.adjust')
ON CONFLICT DO NOTHING;

INSERT INTO "niraya"."PaymentMethods" ("Code", "Name", "RequiresReference", "SortOrder")
VALUES
  ('cash', 'Tunai', false, 1),
  ('qris', 'QRIS', true, 2),
  ('card', 'Kartu', true, 3)
ON CONFLICT ("Code") DO NOTHING;

-- Preserve any custom payment method already used by legacy transactions.
INSERT INTO "niraya"."PaymentMethods" ("Code", "Name", "SortOrder")
SELECT DISTINCT t."PaymentMethod", t."PaymentMethod", 100
FROM "niraya"."Transactions" t
WHERE NOT EXISTS (
  SELECT 1 FROM "niraya"."PaymentMethods" pm WHERE pm."Code" = t."PaymentMethod"
)
ON CONFLICT ("Code") DO NOTHING;

INSERT INTO "niraya"."TaxRates"
  ("Id", "BusinessId", "Name", "Rate", "IsDefault", "IsActive")
SELECT
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'PPN',
  COALESCE(
    (SELECT s."TaxRate" FROM "niraya"."BusinessSettings" s WHERE s."Id" = 'default'),
    0
  ),
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "niraya"."TaxRates" tr
  WHERE tr."Id" = '00000000-0000-0000-0000-000000000003'
);

UPDATE "niraya"."Transactions"
SET "TaxRateId" = '00000000-0000-0000-0000-000000000003'
WHERE "TaxRateId" IS NULL;

INSERT INTO "niraya"."ReceiptSettings"
  ("Id", "BusinessId", "StoreId", "Header", "Footer", "ShowTax", "ShowCashier", "PaperWidth")
SELECT
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  COALESCE(s."BusinessName", ''),
  COALESCE(s."LegacyReceiptFooter", ''),
  true,
  true,
  58
FROM (SELECT 1) AS seed
LEFT JOIN "niraya"."BusinessSettings" s ON s."Id" = 'default'
ON CONFLICT DO NOTHING;

INSERT INTO "niraya"."StoreSettings"
  ("Id", "BusinessId", "StoreId", "LowStockThreshold", "TaxRate")
SELECT
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  COALESCE(s."LowStockThreshold", 10),
  COALESCE(s."TaxRate", 0)
FROM (SELECT 1) AS seed
LEFT JOIN "niraya"."BusinessSettings" s ON s."Id" = 'default'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Backfill data into the new normalized tables
-- -----------------------------------------------------------------------------
INSERT INTO "niraya"."Inventory"
  ("BusinessId", "StoreId", "ProductId", "StockQuantity", "ReservedQuantity", "MinimumStock")
SELECT
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  p."Id",
  p."StockQuantity",
  0,
  p."MinimumStock"
FROM "niraya"."Products" p
ON CONFLICT ("ProductId", "StoreId") DO NOTHING;

INSERT INTO "niraya"."Payments"
  ("TransactionId", "PaymentMethod", "Amount", "Status", "PaidAt")
SELECT
  t."Id",
  t."PaymentMethod",
  COALESCE(t."AmountPaid", t."GrandTotal"),
  'completed',
  t."CreatedAt"
FROM "niraya"."Transactions" t
WHERE NOT EXISTS (
  SELECT 1 FROM "niraya"."Payments" p WHERE p."TransactionId" = t."Id"
);

INSERT INTO "niraya"."TransactionDiscounts"
  ("TransactionId", "Name", "Type", "Value", "Amount", "CreatedAt")
SELECT
  t."Id",
  'Diskon lama',
  'fixed',
  t."DiscountTotal",
  t."DiscountTotal",
  t."CreatedAt"
FROM "niraya"."Transactions" t
WHERE t."DiscountTotal" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "niraya"."TransactionDiscounts" td
    WHERE td."TransactionId" = t."Id"
  );

UPDATE "niraya"."TransactionItems" ti
SET "CostPrice" = p."CostPrice"
FROM "niraya"."Products" p
WHERE ti."ProductId" = p."Id";

-- Preserve stock movement history whose product was deleted: null the FK
-- instead of deleting the history row.
UPDATE "niraya"."StockMovements" sm
SET "ProductId" = NULL
WHERE sm."ProductId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "niraya"."Products" p WHERE p."Id" = sm."ProductId"
  );

UPDATE "niraya"."StockMovements"
SET "ReferenceType" = 'legacy'
WHERE "ReferenceType" IS NULL;

UPDATE "niraya"."StockMovements" sm
SET "StaffId" = s."Id"
FROM "niraya"."Staff" s
WHERE sm."StaffId" IS NULL
  AND sm."StaffName" = s."Name";

UPDATE "niraya"."Staff"
SET "StoreId" = '00000000-0000-0000-0000-000000000002'
WHERE "StoreId" IS NULL;

UPDATE "niraya"."Transactions"
SET "PaymentStatus" = 'voided'
WHERE "Status" = 'voided';

-- -----------------------------------------------------------------------------
-- 8. Normalize legacy values so target CHECK constraints can be validated
-- -----------------------------------------------------------------------------
UPDATE "niraya"."Categories"
SET "Status" = 'active'
WHERE "Status" NOT IN ('active', 'archived');

UPDATE "niraya"."Products"
SET "Status" = 'active'
WHERE "Status" NOT IN ('active', 'archived', 'discontinued');

UPDATE "niraya"."Staff"
SET "Status" = 'active'
WHERE "Status" NOT IN ('active', 'inactive', 'suspended');

UPDATE "niraya"."Transactions"
SET "OrderType" = 'dine-in'
WHERE "OrderType" NOT IN ('dine-in', 'takeaway', 'delivery');

UPDATE "niraya"."Transactions"
SET "Status" = 'completed'
WHERE "Status" NOT IN ('completed', 'voided', 'refunded');

UPDATE "niraya"."Transactions"
SET "PaymentStatus" = 'paid'
WHERE "PaymentStatus" NOT IN ('unpaid', 'partial', 'paid', 'refunded', 'voided');

UPDATE "niraya"."StockMovements"
SET "MovementType" = 'adjustment'
WHERE "MovementType" NOT IN (
  'in', 'out', 'adjustment', 'sale', 'void', 'return', 'purchase', 'transfer'
);

UPDATE "auth"."UserProfiles" up
SET "Role" = 'user'
WHERE NOT EXISTS (
  SELECT 1 FROM "niraya"."Roles" r WHERE r."Code" = up."Role"
);

-- -----------------------------------------------------------------------------
-- 9. Add target constraints for renamed tables
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Categories"
  ADD CONSTRAINT "Categories_Status_check"
  CHECK ("Status" in ('active', 'archived'));

ALTER TABLE "niraya"."Products"
  ADD CONSTRAINT "Products_BusinessId_Sku_key" UNIQUE ("BusinessId", "Sku"),
  ADD CONSTRAINT "Products_Status_check"
    CHECK ("Status" in ('active', 'archived', 'discontinued')),
  ADD CONSTRAINT "Products_SellingPrice_check" CHECK ("SellingPrice" >= 0),
  ADD CONSTRAINT "Products_CostPrice_check" CHECK ("CostPrice" >= 0),
  ADD CONSTRAINT "Products_StockQuantity_check" CHECK ("StockQuantity" >= 0),
  ADD CONSTRAINT "Products_MinimumStock_check" CHECK ("MinimumStock" >= 0);

ALTER TABLE "niraya"."Customers"
  ADD CONSTRAINT "Customers_LoyaltyPoints_check" CHECK ("LoyaltyPoints" >= 0);

ALTER TABLE "niraya"."Staff"
  ADD CONSTRAINT "Staff_BusinessId_Email_key" UNIQUE ("BusinessId", "Email"),
  ADD CONSTRAINT "Staff_Status_check"
    CHECK ("Status" in ('active', 'inactive', 'suspended'));

ALTER TABLE "niraya"."BusinessSettings"
  ADD CONSTRAINT "BusinessSettings_TaxRate_check"
    CHECK ("TaxRate" >= 0 and "TaxRate" <= 1),
  ADD CONSTRAINT "BusinessSettings_MemberDiscountRate_check"
    CHECK ("MemberDiscountRate" >= 0 and "MemberDiscountRate" <= 1),
  ADD CONSTRAINT "BusinessSettings_LowStockThreshold_check"
    CHECK ("LowStockThreshold" >= 0);

ALTER TABLE "niraya"."Transactions"
  ADD CONSTRAINT "Transactions_TransactionNumber_key" UNIQUE ("TransactionNumber"),
  ADD CONSTRAINT "Transactions_OrderType_check"
    CHECK ("OrderType" in ('dine-in', 'takeaway', 'delivery')),
  ADD CONSTRAINT "Transactions_Status_check"
    CHECK ("Status" in ('completed', 'voided', 'refunded')),
  ADD CONSTRAINT "Transactions_PaymentStatus_check"
    CHECK ("PaymentStatus" in ('unpaid', 'partial', 'paid', 'refunded', 'voided')),
  ADD CONSTRAINT "Transactions_Subtotal_check" CHECK ("Subtotal" >= 0),
  ADD CONSTRAINT "Transactions_DiscountTotal_check" CHECK ("DiscountTotal" >= 0),
  ADD CONSTRAINT "Transactions_TaxTotal_check" CHECK ("TaxTotal" >= 0),
  ADD CONSTRAINT "Transactions_GrandTotal_check" CHECK ("GrandTotal" >= 0),
  ADD CONSTRAINT "Transactions_AmountPaid_check"
    CHECK ("AmountPaid" is null or "AmountPaid" >= 0),
  ADD CONSTRAINT "Transactions_ChangeAmount_check"
    CHECK ("ChangeAmount" is null or "ChangeAmount" >= 0);

ALTER TABLE "niraya"."TransactionItems"
  ADD CONSTRAINT "TransactionItems_Quantity_check" CHECK ("Quantity" > 0),
  ADD CONSTRAINT "TransactionItems_UnitPrice_check" CHECK ("UnitPrice" >= 0),
  ADD CONSTRAINT "TransactionItems_DiscountTotal_check" CHECK ("DiscountTotal" >= 0),
  ADD CONSTRAINT "TransactionItems_TaxTotal_check" CHECK ("TaxTotal" >= 0),
  ADD CONSTRAINT "TransactionItems_LineTotal_check" CHECK ("LineTotal" >= 0),
  ADD CONSTRAINT "TransactionItems_CostPrice_check" CHECK ("CostPrice" >= 0);

ALTER TABLE "niraya"."StockMovements"
  ADD CONSTRAINT "StockMovements_StockAfter_check" CHECK ("StockAfter" >= 0),
  ADD CONSTRAINT "StockMovements_MovementType_check"
    CHECK ("MovementType" in (
      'in', 'out', 'adjustment', 'sale', 'void', 'return', 'purchase', 'transfer'
    ));

ALTER TABLE "auth"."UserProfiles"
  ADD CONSTRAINT "UserProfiles_UserId_key" UNIQUE ("UserId");

-- -----------------------------------------------------------------------------
-- 10. Rename legacy primary-key constraints to PascalCase
-- -----------------------------------------------------------------------------
ALTER TABLE "niraya"."Categories"
  RENAME CONSTRAINT "categories_pkey" TO "Categories_pkey";
ALTER TABLE "niraya"."Products"
  RENAME CONSTRAINT "products_pkey" TO "Products_pkey";
ALTER TABLE "niraya"."Customers"
  RENAME CONSTRAINT "customers_pkey" TO "Customers_pkey";
ALTER TABLE "niraya"."Staff"
  RENAME CONSTRAINT "staff_pkey" TO "Staff_pkey";
ALTER TABLE "niraya"."BusinessSettings"
  RENAME CONSTRAINT "settings_pkey" TO "BusinessSettings_pkey";
ALTER TABLE "niraya"."Transactions"
  RENAME CONSTRAINT "transactions_pkey" TO "Transactions_pkey";
ALTER TABLE "niraya"."TransactionItems"
  RENAME CONSTRAINT "transaction_items_pkey" TO "TransactionItems_pkey";
ALTER TABLE "niraya"."StockMovements"
  RENAME CONSTRAINT "stock_movements_pkey" TO "StockMovements_pkey";
ALTER TABLE "niraya"."CheckoutIdempotency"
  RENAME CONSTRAINT "checkout_idempotency_pkey" TO "CheckoutIdempotency_pkey";
ALTER TABLE "auth"."UserProfiles"
  RENAME CONSTRAINT "user_profiles_pkey" TO "UserProfiles_pkey";

-- -----------------------------------------------------------------------------
-- 11. Rename legacy NOT NULL constraints to PascalCase
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      con.conname AS old_name,
      a.attname AS column_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY (con.conkey)
    WHERE con.contype = 'n'
      AND (
        (n.nspname = 'niraya' AND c.relname IN (
          'Categories', 'Products', 'Customers', 'Staff', 'BusinessSettings',
          'Transactions', 'TransactionItems', 'StockMovements',
          'CheckoutIdempotency'
        ))
        OR (n.nspname = 'auth' AND c.relname = 'UserProfiles')
      )
      AND con.conname <> (c.relname || '_' || a.attname || '_not_null')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I',
      r.schema_name,
      r.table_name,
      r.old_name,
      r.table_name || '_' || r.column_name || '_not_null'
    );
  END LOOP;
END $$;
ALTER TABLE "niraya"."AuditLogs" ADD CONSTRAINT "AuditLogs_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."FileAttachments" ADD CONSTRAINT "FileAttachments_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Notifications" ADD CONSTRAINT "Notifications_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."BusinessMembers" ADD CONSTRAINT "BusinessMembers_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."BusinessMembers" ADD CONSTRAINT "BusinessMembers_Role_Roles_Code_fk" FOREIGN KEY ("Role") REFERENCES "niraya"."Roles"("Code") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."BusinessMembers" ADD CONSTRAINT "BusinessMembers_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."RolePermissions" ADD CONSTRAINT "RolePermissions_RoleCode_Roles_Code_fk" FOREIGN KEY ("RoleCode") REFERENCES "niraya"."Roles"("Code") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."RolePermissions" ADD CONSTRAINT "RolePermissions_PermissionCode_Permissions_Code_fk" FOREIGN KEY ("PermissionCode") REFERENCES "niraya"."Permissions"("Code") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Stores" ADD CONSTRAINT "Stores_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "auth"."UserProfiles" ADD CONSTRAINT "UserProfiles_Role_Roles_Code_fk" FOREIGN KEY ("Role") REFERENCES "niraya"."Roles"("Code") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."CustomerAddresses" ADD CONSTRAINT "CustomerAddresses_CustomerId_Customers_Id_fk" FOREIGN KEY ("CustomerId") REFERENCES "niraya"."Customers"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Customers" ADD CONSTRAINT "Customers_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Categories" ADD CONSTRAINT "Categories_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Categories" ADD CONSTRAINT "Categories_ParentCategoryId_Categories_Id_fk" FOREIGN KEY ("ParentCategoryId") REFERENCES "niraya"."Categories"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."ProductBarcodes" ADD CONSTRAINT "ProductBarcodes_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ProductPrices" ADD CONSTRAINT "ProductPrices_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ProductPrices" ADD CONSTRAINT "ProductPrices_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."ProductUnits" ADD CONSTRAINT "ProductUnits_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ProductVariants" ADD CONSTRAINT "ProductVariants_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ProductVariants" ADD CONSTRAINT "ProductVariants_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Products" ADD CONSTRAINT "Products_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Products" ADD CONSTRAINT "Products_CategoryId_Categories_Id_fk" FOREIGN KEY ("CategoryId") REFERENCES "niraya"."Categories"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Inventory" ADD CONSTRAINT "Inventory_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Inventory" ADD CONSTRAINT "Inventory_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Inventory" ADD CONSTRAINT "Inventory_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."StockAdjustments" ADD CONSTRAINT "StockAdjustments_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StockAdjustments" ADD CONSTRAINT "StockAdjustments_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StockAdjustments" ADD CONSTRAINT "StockAdjustments_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."StockMovements" ADD CONSTRAINT "StockMovements_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StockMovements" ADD CONSTRAINT "StockMovements_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StockMovements" ADD CONSTRAINT "StockMovements_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."StockMovements" ADD CONSTRAINT "StockMovements_StaffId_Staff_Id_fk" FOREIGN KEY ("StaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Discounts" ADD CONSTRAINT "Discounts_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."TaxRates" ADD CONSTRAINT "TaxRates_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."CashMovements" ADD CONSTRAINT "CashMovements_SessionId_CashRegisterSessions_Id_fk" FOREIGN KEY ("SessionId") REFERENCES "niraya"."CashRegisterSessions"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."CashMovements" ADD CONSTRAINT "CashMovements_StaffId_Staff_Id_fk" FOREIGN KEY ("StaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisterSessions" ADD CONSTRAINT "CashRegisterSessions_CashRegisterId_CashRegisters_Id_fk" FOREIGN KEY ("CashRegisterId") REFERENCES "niraya"."CashRegisters"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisterSessions" ADD CONSTRAINT "CashRegisterSessions_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisterSessions" ADD CONSTRAINT "CashRegisterSessions_OpenedByStaffId_Staff_Id_fk" FOREIGN KEY ("OpenedByStaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisterSessions" ADD CONSTRAINT "CashRegisterSessions_ClosedByStaffId_Staff_Id_fk" FOREIGN KEY ("ClosedByStaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisters" ADD CONSTRAINT "CashRegisters_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."CashRegisters" ADD CONSTRAINT "CashRegisters_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Shifts" ADD CONSTRAINT "Shifts_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Shifts" ADD CONSTRAINT "Shifts_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Shifts" ADD CONSTRAINT "Shifts_StaffId_Staff_Id_fk" FOREIGN KEY ("StaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."Staff" ADD CONSTRAINT "Staff_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Staff" ADD CONSTRAINT "Staff_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Staff" ADD CONSTRAINT "Staff_Role_Roles_Code_fk" FOREIGN KEY ("Role") REFERENCES "niraya"."Roles"("Code") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."Suppliers" ADD CONSTRAINT "Suppliers_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."GoodsReceiptItems" ADD CONSTRAINT "GoodsReceiptItems_GoodsReceiptId_GoodsReceipts_Id_fk" FOREIGN KEY ("GoodsReceiptId") REFERENCES "niraya"."GoodsReceipts"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."GoodsReceiptItems" ADD CONSTRAINT "GoodsReceiptItems_PurchaseOrderItemId_PurchaseOrderItems_Id_fk" FOREIGN KEY ("PurchaseOrderItemId") REFERENCES "niraya"."PurchaseOrderItems"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."GoodsReceiptItems" ADD CONSTRAINT "GoodsReceiptItems_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."GoodsReceipts" ADD CONSTRAINT "GoodsReceipts_PurchaseOrderId_PurchaseOrders_Id_fk" FOREIGN KEY ("PurchaseOrderId") REFERENCES "niraya"."PurchaseOrders"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."PurchaseOrderItems" ADD CONSTRAINT "PurchaseOrderItems_PurchaseOrderId_PurchaseOrders_Id_fk" FOREIGN KEY ("PurchaseOrderId") REFERENCES "niraya"."PurchaseOrders"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."PurchaseOrderItems" ADD CONSTRAINT "PurchaseOrderItems_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."PurchaseOrders" ADD CONSTRAINT "PurchaseOrders_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."PurchaseOrders" ADD CONSTRAINT "PurchaseOrders_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."PurchaseOrders" ADD CONSTRAINT "PurchaseOrders_SupplierId_Suppliers_Id_fk" FOREIGN KEY ("SupplierId") REFERENCES "niraya"."Suppliers"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."CheckoutIdempotency" ADD CONSTRAINT "CheckoutIdempotency_TransactionId_Transactions_Id_fk" FOREIGN KEY ("TransactionId") REFERENCES "niraya"."Transactions"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."TransactionItems" ADD CONSTRAINT "TransactionItems_TransactionId_Transactions_Id_fk" FOREIGN KEY ("TransactionId") REFERENCES "niraya"."Transactions"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."TransactionItems" ADD CONSTRAINT "TransactionItems_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."TransactionItems" ADD CONSTRAINT "TransactionItems_ProductVariantId_ProductVariants_Id_fk" FOREIGN KEY ("ProductVariantId") REFERENCES "niraya"."ProductVariants"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_StaffId_Staff_Id_fk" FOREIGN KEY ("StaffId") REFERENCES "niraya"."Staff"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_CustomerId_Customers_Id_fk" FOREIGN KEY ("CustomerId") REFERENCES "niraya"."Customers"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_PaymentMethod_PaymentMethods_Code_fk" FOREIGN KEY ("PaymentMethod") REFERENCES "niraya"."PaymentMethods"("Code") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."Transactions" ADD CONSTRAINT "Transactions_TaxRateId_TaxRates_Id_fk" FOREIGN KEY ("TaxRateId") REFERENCES "niraya"."TaxRates"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."Payments" ADD CONSTRAINT "Payments_TransactionId_Transactions_Id_fk" FOREIGN KEY ("TransactionId") REFERENCES "niraya"."Transactions"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."Payments" ADD CONSTRAINT "Payments_PaymentMethod_PaymentMethods_Code_fk" FOREIGN KEY ("PaymentMethod") REFERENCES "niraya"."PaymentMethods"("Code") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."TransactionDiscounts" ADD CONSTRAINT "TransactionDiscounts_TransactionId_Transactions_Id_fk" FOREIGN KEY ("TransactionId") REFERENCES "niraya"."Transactions"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."TransactionDiscounts" ADD CONSTRAINT "TransactionDiscounts_DiscountId_Discounts_Id_fk" FOREIGN KEY ("DiscountId") REFERENCES "niraya"."Discounts"("Id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "niraya"."TransactionRefundItems" ADD CONSTRAINT "TransactionRefundItems_RefundId_TransactionRefunds_Id_fk" FOREIGN KEY ("RefundId") REFERENCES "niraya"."TransactionRefunds"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."TransactionRefundItems" ADD CONSTRAINT "TransactionRefundItems_TransactionItemId_TransactionItems_Id_fk" FOREIGN KEY ("TransactionItemId") REFERENCES "niraya"."TransactionItems"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."TransactionRefundItems" ADD CONSTRAINT "TransactionRefundItems_ProductId_Products_Id_fk" FOREIGN KEY ("ProductId") REFERENCES "niraya"."Products"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."TransactionRefunds" ADD CONSTRAINT "TransactionRefunds_TransactionId_Transactions_Id_fk" FOREIGN KEY ("TransactionId") REFERENCES "niraya"."Transactions"("Id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "niraya"."BusinessSettings" ADD CONSTRAINT "BusinessSettings_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ReceiptSettings" ADD CONSTRAINT "ReceiptSettings_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."ReceiptSettings" ADD CONSTRAINT "ReceiptSettings_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StoreSettings" ADD CONSTRAINT "StoreSettings_BusinessId_Businesses_Id_fk" FOREIGN KEY ("BusinessId") REFERENCES "niraya"."Businesses"("Id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "niraya"."StoreSettings" ADD CONSTRAINT "StoreSettings_StoreId_Stores_Id_fk" FOREIGN KEY ("StoreId") REFERENCES "niraya"."Stores"("Id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "AuditLogs_BusinessId_idx" ON "niraya"."AuditLogs" USING btree ("BusinessId");

CREATE INDEX "AuditLogs_UserId_idx" ON "niraya"."AuditLogs" USING btree ("UserId");

CREATE INDEX "AuditLogs_EntityType_EntityId_idx" ON "niraya"."AuditLogs" USING btree ("EntityType","EntityId");

CREATE INDEX "AuditLogs_CreatedAt_idx" ON "niraya"."AuditLogs" USING btree ("CreatedAt");

CREATE INDEX "FileAttachments_BusinessId_idx" ON "niraya"."FileAttachments" USING btree ("BusinessId");

CREATE INDEX "FileAttachments_EntityType_EntityId_idx" ON "niraya"."FileAttachments" USING btree ("EntityType","EntityId");

CREATE INDEX "FileAttachments_StorageKey_idx" ON "niraya"."FileAttachments" USING btree ("StorageKey");

CREATE INDEX "Notifications_BusinessId_idx" ON "niraya"."Notifications" USING btree ("BusinessId");

CREATE INDEX "Notifications_UserId_idx" ON "niraya"."Notifications" USING btree ("UserId");

CREATE INDEX "Notifications_ReadAt_idx" ON "niraya"."Notifications" USING btree ("ReadAt");

CREATE INDEX "Notifications_CreatedAt_idx" ON "niraya"."Notifications" USING btree ("CreatedAt");

CREATE INDEX "BusinessMembers_BusinessId_idx" ON "niraya"."BusinessMembers" USING btree ("BusinessId");

CREATE INDEX "BusinessMembers_UserId_idx" ON "niraya"."BusinessMembers" USING btree ("UserId");

CREATE INDEX "BusinessMembers_StoreId_idx" ON "niraya"."BusinessMembers" USING btree ("StoreId");

CREATE INDEX "Businesses_Status_idx" ON "niraya"."Businesses" USING btree ("Status");

CREATE INDEX "Permissions_Module_idx" ON "niraya"."Permissions" USING btree ("Module");

CREATE INDEX "RolePermissions_RoleCode_idx" ON "niraya"."RolePermissions" USING btree ("RoleCode");

CREATE INDEX "RolePermissions_PermissionCode_idx" ON "niraya"."RolePermissions" USING btree ("PermissionCode");

CREATE INDEX "Roles_Rank_idx" ON "niraya"."Roles" USING btree ("Rank");

CREATE INDEX "Stores_BusinessId_idx" ON "niraya"."Stores" USING btree ("BusinessId");

CREATE INDEX "Stores_IsActive_idx" ON "niraya"."Stores" USING btree ("IsActive");

CREATE INDEX "UserProfiles_Role_idx" ON "auth"."UserProfiles" USING btree ("Role");

CREATE INDEX "UserProfiles_Email_idx" ON "auth"."UserProfiles" USING btree ("Email");

CREATE INDEX "CustomerAddresses_CustomerId_idx" ON "niraya"."CustomerAddresses" USING btree ("CustomerId");

CREATE INDEX "CustomerAddresses_IsPrimary_idx" ON "niraya"."CustomerAddresses" USING btree ("IsPrimary");

CREATE INDEX "Customers_BusinessId_idx" ON "niraya"."Customers" USING btree ("BusinessId");

CREATE INDEX "Customers_Phone_idx" ON "niraya"."Customers" USING btree ("Phone");

CREATE INDEX "Customers_Email_idx" ON "niraya"."Customers" USING btree ("Email");

CREATE INDEX "Customers_Name_idx" ON "niraya"."Customers" USING btree ("Name");

CREATE INDEX "Categories_BusinessId_idx" ON "niraya"."Categories" USING btree ("BusinessId");

CREATE INDEX "Categories_ParentCategoryId_idx" ON "niraya"."Categories" USING btree ("ParentCategoryId");

CREATE INDEX "Categories_Name_idx" ON "niraya"."Categories" USING btree ("Name");

CREATE INDEX "Categories_Status_idx" ON "niraya"."Categories" USING btree ("Status");

CREATE INDEX "ProductBarcodes_ProductId_idx" ON "niraya"."ProductBarcodes" USING btree ("ProductId");

CREATE INDEX "ProductPrices_ProductId_idx" ON "niraya"."ProductPrices" USING btree ("ProductId");

CREATE INDEX "ProductPrices_StoreId_idx" ON "niraya"."ProductPrices" USING btree ("StoreId");

CREATE INDEX "ProductPrices_PriceType_idx" ON "niraya"."ProductPrices" USING btree ("PriceType");

CREATE INDEX "ProductUnits_ProductId_idx" ON "niraya"."ProductUnits" USING btree ("ProductId");

CREATE INDEX "ProductVariants_ProductId_idx" ON "niraya"."ProductVariants" USING btree ("ProductId");

CREATE INDEX "ProductVariants_Barcode_idx" ON "niraya"."ProductVariants" USING btree ("Barcode");

CREATE INDEX "Products_BusinessId_idx" ON "niraya"."Products" USING btree ("BusinessId");

CREATE INDEX "Products_CategoryId_idx" ON "niraya"."Products" USING btree ("CategoryId");

CREATE INDEX "Products_Barcode_idx" ON "niraya"."Products" USING btree ("Barcode");

CREATE INDEX "Products_Name_idx" ON "niraya"."Products" USING btree ("Name");

CREATE INDEX "Products_Status_idx" ON "niraya"."Products" USING btree ("Status");

CREATE INDEX "Inventory_BusinessId_idx" ON "niraya"."Inventory" USING btree ("BusinessId");

CREATE INDEX "Inventory_StoreId_idx" ON "niraya"."Inventory" USING btree ("StoreId");

CREATE INDEX "Inventory_ProductId_idx" ON "niraya"."Inventory" USING btree ("ProductId");

CREATE INDEX "StockAdjustments_BusinessId_idx" ON "niraya"."StockAdjustments" USING btree ("BusinessId");

CREATE INDEX "StockAdjustments_StoreId_idx" ON "niraya"."StockAdjustments" USING btree ("StoreId");

CREATE INDEX "StockAdjustments_ProductId_idx" ON "niraya"."StockAdjustments" USING btree ("ProductId");

CREATE INDEX "StockAdjustments_CreatedAt_idx" ON "niraya"."StockAdjustments" USING btree ("CreatedAt");

CREATE INDEX "StockMovements_BusinessId_idx" ON "niraya"."StockMovements" USING btree ("BusinessId");

CREATE INDEX "StockMovements_StoreId_idx" ON "niraya"."StockMovements" USING btree ("StoreId");

CREATE INDEX "StockMovements_ProductId_idx" ON "niraya"."StockMovements" USING btree ("ProductId");

CREATE INDEX "StockMovements_CreatedAt_idx" ON "niraya"."StockMovements" USING btree ("CreatedAt");

CREATE INDEX "StockMovements_ReferenceId_idx" ON "niraya"."StockMovements" USING btree ("ReferenceId");

CREATE INDEX "Discounts_BusinessId_idx" ON "niraya"."Discounts" USING btree ("BusinessId");

CREATE INDEX "Discounts_IsActive_idx" ON "niraya"."Discounts" USING btree ("IsActive");

CREATE INDEX "PaymentMethods_IsActive_idx" ON "niraya"."PaymentMethods" USING btree ("IsActive");

CREATE INDEX "PaymentMethods_SortOrder_idx" ON "niraya"."PaymentMethods" USING btree ("SortOrder");

CREATE INDEX "TaxRates_BusinessId_idx" ON "niraya"."TaxRates" USING btree ("BusinessId");

CREATE INDEX "TaxRates_IsDefault_idx" ON "niraya"."TaxRates" USING btree ("IsDefault");

CREATE INDEX "CashMovements_SessionId_idx" ON "niraya"."CashMovements" USING btree ("SessionId");

CREATE INDEX "CashMovements_StaffId_idx" ON "niraya"."CashMovements" USING btree ("StaffId");

CREATE INDEX "CashMovements_CreatedAt_idx" ON "niraya"."CashMovements" USING btree ("CreatedAt");

CREATE INDEX "CashRegisterSessions_CashRegisterId_idx" ON "niraya"."CashRegisterSessions" USING btree ("CashRegisterId");

CREATE INDEX "CashRegisterSessions_StoreId_idx" ON "niraya"."CashRegisterSessions" USING btree ("StoreId");

CREATE INDEX "CashRegisterSessions_OpenedByStaffId_idx" ON "niraya"."CashRegisterSessions" USING btree ("OpenedByStaffId");

CREATE INDEX "CashRegisterSessions_Status_idx" ON "niraya"."CashRegisterSessions" USING btree ("Status");

CREATE INDEX "CashRegisters_BusinessId_idx" ON "niraya"."CashRegisters" USING btree ("BusinessId");

CREATE INDEX "CashRegisters_StoreId_idx" ON "niraya"."CashRegisters" USING btree ("StoreId");

CREATE INDEX "Shifts_BusinessId_idx" ON "niraya"."Shifts" USING btree ("BusinessId");

CREATE INDEX "Shifts_StoreId_idx" ON "niraya"."Shifts" USING btree ("StoreId");

CREATE INDEX "Shifts_StaffId_idx" ON "niraya"."Shifts" USING btree ("StaffId");

CREATE INDEX "Shifts_StartTime_idx" ON "niraya"."Shifts" USING btree ("StartTime");

CREATE INDEX "Staff_BusinessId_idx" ON "niraya"."Staff" USING btree ("BusinessId");

CREATE INDEX "Staff_StoreId_idx" ON "niraya"."Staff" USING btree ("StoreId");

CREATE INDEX "Staff_UserId_idx" ON "niraya"."Staff" USING btree ("UserId");

CREATE INDEX "Staff_Role_idx" ON "niraya"."Staff" USING btree ("Role");

CREATE INDEX "Staff_Status_idx" ON "niraya"."Staff" USING btree ("Status");

CREATE INDEX "Suppliers_BusinessId_idx" ON "niraya"."Suppliers" USING btree ("BusinessId");

CREATE INDEX "Suppliers_Name_idx" ON "niraya"."Suppliers" USING btree ("Name");

CREATE INDEX "Suppliers_Status_idx" ON "niraya"."Suppliers" USING btree ("Status");

CREATE INDEX "GoodsReceiptItems_GoodsReceiptId_idx" ON "niraya"."GoodsReceiptItems" USING btree ("GoodsReceiptId");

CREATE INDEX "GoodsReceiptItems_PurchaseOrderItemId_idx" ON "niraya"."GoodsReceiptItems" USING btree ("PurchaseOrderItemId");

CREATE INDEX "GoodsReceiptItems_ProductId_idx" ON "niraya"."GoodsReceiptItems" USING btree ("ProductId");

CREATE INDEX "GoodsReceipts_PurchaseOrderId_idx" ON "niraya"."GoodsReceipts" USING btree ("PurchaseOrderId");

CREATE INDEX "GoodsReceipts_ReceivedAt_idx" ON "niraya"."GoodsReceipts" USING btree ("ReceivedAt");

CREATE INDEX "PurchaseOrderItems_PurchaseOrderId_idx" ON "niraya"."PurchaseOrderItems" USING btree ("PurchaseOrderId");

CREATE INDEX "PurchaseOrderItems_ProductId_idx" ON "niraya"."PurchaseOrderItems" USING btree ("ProductId");

CREATE INDEX "PurchaseOrders_BusinessId_idx" ON "niraya"."PurchaseOrders" USING btree ("BusinessId");

CREATE INDEX "PurchaseOrders_StoreId_idx" ON "niraya"."PurchaseOrders" USING btree ("StoreId");

CREATE INDEX "PurchaseOrders_SupplierId_idx" ON "niraya"."PurchaseOrders" USING btree ("SupplierId");

CREATE INDEX "PurchaseOrders_Status_idx" ON "niraya"."PurchaseOrders" USING btree ("Status");

CREATE INDEX "PurchaseOrders_OrderDate_idx" ON "niraya"."PurchaseOrders" USING btree ("OrderDate");

CREATE INDEX "CheckoutIdempotency_TransactionId_idx" ON "niraya"."CheckoutIdempotency" USING btree ("TransactionId");

CREATE INDEX "CheckoutIdempotency_ExpiresAt_idx" ON "niraya"."CheckoutIdempotency" USING btree ("ExpiresAt");

CREATE INDEX "TransactionItems_TransactionId_idx" ON "niraya"."TransactionItems" USING btree ("TransactionId");

CREATE INDEX "TransactionItems_ProductId_idx" ON "niraya"."TransactionItems" USING btree ("ProductId");

CREATE INDEX "TransactionItems_ProductVariantId_idx" ON "niraya"."TransactionItems" USING btree ("ProductVariantId");

CREATE INDEX "Transactions_BusinessId_idx" ON "niraya"."Transactions" USING btree ("BusinessId");

CREATE INDEX "Transactions_StoreId_idx" ON "niraya"."Transactions" USING btree ("StoreId");

CREATE INDEX "Transactions_CustomerId_idx" ON "niraya"."Transactions" USING btree ("CustomerId");

CREATE INDEX "Transactions_StaffId_idx" ON "niraya"."Transactions" USING btree ("StaffId");

CREATE INDEX "Transactions_CreatedAt_idx" ON "niraya"."Transactions" USING btree ("CreatedAt");

CREATE INDEX "Transactions_Status_idx" ON "niraya"."Transactions" USING btree ("Status");

CREATE INDEX "Transactions_PaymentMethod_idx" ON "niraya"."Transactions" USING btree ("PaymentMethod");

CREATE INDEX "Payments_TransactionId_idx" ON "niraya"."Payments" USING btree ("TransactionId");

CREATE INDEX "Payments_PaymentMethod_idx" ON "niraya"."Payments" USING btree ("PaymentMethod");

CREATE INDEX "Payments_PaidAt_idx" ON "niraya"."Payments" USING btree ("PaidAt");

CREATE INDEX "TransactionDiscounts_TransactionId_idx" ON "niraya"."TransactionDiscounts" USING btree ("TransactionId");

CREATE INDEX "TransactionDiscounts_DiscountId_idx" ON "niraya"."TransactionDiscounts" USING btree ("DiscountId");

CREATE INDEX "TransactionRefundItems_RefundId_idx" ON "niraya"."TransactionRefundItems" USING btree ("RefundId");

CREATE INDEX "TransactionRefundItems_TransactionItemId_idx" ON "niraya"."TransactionRefundItems" USING btree ("TransactionItemId");

CREATE INDEX "TransactionRefundItems_ProductId_idx" ON "niraya"."TransactionRefundItems" USING btree ("ProductId");

CREATE INDEX "TransactionRefunds_TransactionId_idx" ON "niraya"."TransactionRefunds" USING btree ("TransactionId");

CREATE INDEX "TransactionRefunds_Status_idx" ON "niraya"."TransactionRefunds" USING btree ("Status");

CREATE INDEX "BusinessSettings_BusinessId_idx" ON "niraya"."BusinessSettings" USING btree ("BusinessId");

CREATE INDEX "ReceiptSettings_BusinessId_idx" ON "niraya"."ReceiptSettings" USING btree ("BusinessId");

CREATE INDEX "ReceiptSettings_StoreId_idx" ON "niraya"."ReceiptSettings" USING btree ("StoreId");

CREATE INDEX "StoreSettings_BusinessId_idx" ON "niraya"."StoreSettings" USING btree ("BusinessId");
