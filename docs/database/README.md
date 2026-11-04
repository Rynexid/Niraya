# NIRAYA POS Database Schema

This directory contains documentation for the NIRAYA POS database schema, relationships, constraints, indexes, migrations, and integrity rules.

## Overview

The NIRAYA POS business data resides in the **`niraya`** PostgreSQL schema. This schema contains tables for core business entities: businesses, stores, staff, customers, products, categories, inventory, transactions, payments, and related lookups (payment methods, tax rates, discounts, etc.).

**Key principles:**
- **PascalCase** is used for all business table/column identifiers (including indexes, constraints, and enums). The legacy `auth."UserProfiles"` table is an exception: it stays within the `auth` schema but also follows PascalCase.
- **`niraya`** is the sole schema for business data. **Neon Auth** internal tables remain in `auth` unchanged.
- **Business tables are the single source of truth**; no mock/demo fallback when DB requests fail.
- **Multi‑business ownership** is explicit (each row belongs to a `Businesses` row). Multi‑store is extensible per business, but there is no enterprise‑level multi‑tenancy.
- **FKs, NOT NULL, CHECK, and targeted indexes** are enforced. Money fields use `numeric(14,2)`. Dates are `timestamp with time zone`. UUIDs are default for new tables.
- **Soft delete** is only used where justified (e.g., `DeletedAt` in most entities). Deleted rows are excluded from business queries (the application filters them out). No FK `ON DELETE` actions are taken.
- **No destructive migrations**: all changes are additive or rename‑based. Existing data is preserved.

## Migration Strategy

The current schema is the legacy snake_case structure (e.g., `niraya.products`). The migration (`0001_pascalcase_schema`) renames tables/columns to PascalCase and adds missing columns, FKs, and constraints. It does **not** drop or recreate any business table.

### Steps to apply the migration (to a dev branch):

1. Ensure you have a clean copy of the legacy DB (i.e., the production branch `br-morning-king-aouagwa6`).
2. In the Neon console, create a new branch from `production`.
3. Connect to the new branch (e.g., via `DATABASE_URL` scoped to that branch).
4. Run the migration SQL file `drizzle/0001_pascalcase_schema.sql` using `psql` or Neon console.
   - The migration is safe; no data loss.
5. Seed master data (businesses, stores, roles, permissions, payment methods, tax rates, settings) – the migration already includes this step.
6. Verify data integrity with the provided integrity checks (see **Integrity Rules**).
7. Run the application’s test suite to ensure checkout, staff, and other endpoints work correctly.

## Schema Overview

### Core Tables (`niraya`)

| Table | Purpose |
|-------|---------|
| `Businesses` | Business profile, default currency/timezone, status. |
| `Stores` | Physical or logical store locations per business. |
| `Roles` | Authorization levels (user, cashier, manager, admin, owner). |
| `Permissions` | Granular permissions (`category.create`, `product.update`, …). |
| `RolePermissions` | Many‑to‑many mapping between `Roles` and `Permissions`. |

### Lookups (`niraya`)

| Table | Purpose |
|-------|---------|
| `PaymentMethods` | Supported payment methods (cash, qris, card). |
| `TaxRates` | Business‑level tax rates, one marked as default. |
| `Discounts` | Discount templates (fixed/percentage). |

### Settings (`niraya`)

| Table | Purpose |
|-------|---------|
| `BusinessSettings` | Global business configuration (receipt footer, thresholds, etc.). |
| `StoreSettings` | Store‑specific overrides of thresholds/tax. |
| `ReceiptSettings` | Receipt layout (header, footer, paper width, visibility toggles). |

### Products & Inventory (`niraya`)

| Table | Purpose |
|-------|---------|
| `Categories` | Product categorization, hierarchy via `ParentCategoryId`. |
| `Products` | Product catalog with pricing, stock, status. |
| `ProductVariants`, `ProductUnits`, `ProductBarcodes`, `ProductPrices` | Granular product attributes. |
| `Inventory` | Per‑store stock authority (authoritative). |
| `StockMovements` | Detailed change log (sales, adjustments, transfers). |
| `StockAdjustments` | Dedicated stock adjustment records. |

### Transactions & Payments (`niraya`)

| Table | Purpose |
|-------|---------|
| `Customers` | Customer master data, loyalty points. |
| `CustomerAddresses` | Shipping addresses per customer. |
| `Staff` | Staff members (linked to `auth.UserProfiles` via `UserId`). |
| `Shifts`, `CashRegisters`, `CashRegisterSessions`, `CashMovements` | Cash‑handling and shift tracking. |
| `PurchaseOrders`, `PurchaseOrderItems`, `GoodsReceipts`, `GoodsReceiptItems` | Supplier procurement. |
| `Suppliers` | Supplier master data. |
| `Transactions` | POS transaction headers (checkout, payments, discounts, tax). |
| `TransactionItems` | Line‑items per transaction. |
| `CheckoutIdempotency` | Idempotent checkout key storage. |
| `Payments` | Payment rows (cash, qris, card). |
| `TransactionDiscounts` | Applied discount rows. |
| `TransactionRefunds`, `TransactionRefundItems` | Refund handling. |

### Logging & Metadata (`niraya`)

| Table | Purpose |
|-------|---------|
| `AuditLogs` | Full‑audit trail of changes to business entities. |
| `Notifications` | In‑app notifications for business events. |
| `FileAttachments` | Upload storage (images, documents) linked to entities. |

### Authentication (`auth`)

| Table | Purpose |
|-------|---------|
| `UserProfiles` | Bridges Neon Auth users to business roles (`Roles`). One‑to‑one with `neon_auth.users`. Includes `DeletedAt` soft‑delete. |

## Relationships

### Key FKs

- **`Products.BusinessId` → `Businesses.Id`** – Every product belongs to a business.
- **`Products.CategoryId` → `Categories.Id`** – Optional hierarchy.
- **`Inventory.ProductId` → `Products.Id`** – Authoritative stock per store.
- **`StockMovements.ProductId` → `Products.Id`** – Nullable (legacy orphan support).
- **`Transactions.StaffId` → `Staff.Id`** – The staff member who performed the transaction.
- **`Transactions.CustomerId` → `Customers.Id`** – Optional guest.
- **`TransactionItems.ProductId` → `Products.Id`** – Must exist at time of checkout.
- **`Staff.Role` → `Roles.Code`** – Role hierarchy.
- **`BusinessMembers` → `Roles`** – Membership mapping (many‑to‑many).
- **`Payments.TransactionId` → `Transactions.Id`** – Payment belongs to a transaction.
- **`Payments.PaymentMethod` → `PaymentMethods.Code`** – Method used.
- **`ReceiptSettings`/`StoreSettings` → `Businesses`/`Stores`** – Configuration scope.
- **`UserProfiles.Role` → `Roles.Code`** – Business role for the auth user.

### Cardinalities

- **One‑to‑One**: `Businesses` ↔ `BusinessSettings` (default row).
- **One‑to‑Many**: `Businesses` → `Stores`, `Staff`.
- **Many‑to‑Many**: `Roles` ↔ `Permissions` via `RolePermissions`.
- **Optional**: `Products.CategoryId`, `Customers.Email`, `Staff.StoreId`.

## Constraints & Indexes

### Primary Keys (PK)

All tables have a PK, usually `Id` (UUID) or composite PKs (e.g., `RolePermissions` PK = (`RoleCode`, `PermissionCode`)).

### Unique Constraints

| Table | Unique Constraint |
|-------|------------------|
| `Businesses` | `Slug` |
| `Roles` | `Name` |
| `Permissions` | `Name` |
| `Stores` | `BusinessId` + `Code` |
| `Products` | `BusinessId` + `Sku` |
| `PaymentMethods` | `Code` |
| `Staff` | `BusinessId` + `Email` |
| `TaxRates` | `BusinessId` + `Name` |
| `Discounts` | `BusinessId` + `Code` |
| `StoreSettings` | `StoreId` |
| `Products` | `BusinessId` + `Sku` (duplicate entry in earlier spec) |
| `UserProfiles` | `UserId` |
| `Transactions` | `TransactionNumber` |
| `ReceiptSettings` | None (but unique per business/store via constraints?) |
| `Invoices` etc. – omitted for brevity. |

### Foreign Key Constraints

All FKs use `ON DELETE` actions appropriate for business rules (e.g., `CASCADE` for dependent rows, `SET NULL` where appropriate, `RESTRICT` to protect data).

### Check Constraints

Each table that should enforce business rules includes CHECK constraints (e.g., `Products.Status_check`, `Transactions.Subtotal_check`, `StockMovements.MovementType_check`, etc.). Full list is in the migration.

### Targeted Indexes

| Table | Index |
|-------|-------|
| `AuditLogs`, `FileAttachments`, `Notifications` | BusinessId, UserId, EntityType, CreatedAt |
| `BusinessMembers` | BusinessId, Role, StoreId |
| `Businesses` | `Slug` (PK), `Status` |
| `Categories` | BusinessId, ParentCategoryId, Name, Status |
| `Customers` | BusinessId, Phone, Email, Name |
| `Products` | BusinessId, CategoryId, Barcode, Name, Status |
| `Inventory` | ProductId + StoreId (unique), StockQuantity, ReservedQuantity, MinimumStock checks |
| `StockMovements` | BusinessId, StoreId, ProductId, CreatedAt, ReferenceId |
| `Staff` | BusinessId, StoreId, UserId, Role, Status |
| `Shifts` | BusinessId, StoreId, StaffId, Status |
| `Suppliers` | BusinessId, Status |
| `Payments` | TransactionId, Status |
| `TransactionItems` | TransactionId, ProductId, ProductVariantId |
| `Transactions` | BusinessId, StoreId, CustomerId, StaffId, CreatedAt, Status, PaymentMethod, TaxRateId |
| `TaxRates` | BusinessId, IsDefault, IsActive |
| `CashMovements` | SessionId, StaffId |
| `CashRegisterSessions` | CashRegisterId, StoreId, StaffId |
| `Shifts` | BusinessId, StoreId, StaffId, Status |
| `Suppliers` | BusinessId, Status |
| `Payments` | TransactionId, Status |
| `TransactionDiscounts` | TransactionId, DiscountId |
| `TransactionRefundItems` | RefundId, TransactionItemId |
| `TransactionRefunds` | TransactionId |
| `BusinessSettings` | BusinessId |
| `ReceiptSettings` | BusinessId |
| `StoreSettings` | BusinessId, StoreId |

## Data Dictionary

### Example Tables (columns listed with types)

**Businesses**

| Column | Type | Description |
|--------|------|-------------|
| Id | uuid | PK, default random UUID. |
| Name | text | Business legal name. |
| Slug | text | URL‑friendly identifier (`niraya`). |
| LegalName | text | Same as Name, kept for legacy compatibility. |
| Currency | text | ISO 4217 code (`IDR`). |
| Timezone | text | IANA timezone (`Asia/Jakarta`). |
| OwnerUserId | text | Optional link to an auth user with owner role. |
| Status | text | `active`, `suspended`, `archived`. |
| CreatedAt / UpdatedAt / DeletedAt | timestamptz | Audit timestamps. |

**Products**

| Column | Type | Description |
|--------|------|-------------|
| Id | text | Legacy product ID (preserved). |
| BusinessId | uuid | FK → Businesses. |
| CategoryId | text | FK → Categories (nullable). |
| Name | text | Product name. |
| Description | text | Optional full description. |
| Sku | text | Stock‑keeping unit (unique per business). |
| Barcode | text | Optional barcode. |
| SellingPrice | numeric(14,2) | Selling price. |
| CostPrice | numeric(14,2) | Cost price. |
| StockQuantity | integer | Cache of current stock (synced with Inventory). |
| MinimumStock | integer | Re‑order threshold. |
| Unit | text | Base unit (`pcs`, `kg`, …). |
| ImageUrl | text | Optional image. |
| IsTaxable | boolean | Whether the product is taxable. |
| IsStockTracked | boolean | If stock is tracked per store. |
| Status | text | `active`, `archived`, `discontinued`. |
| CreatedAt / UpdatedAt / ArchivedAt / DeletedAt | timestamptz | Timestamps. |

**Inventory**

| Column | Type | Description |
|--------|------|-------------|
| BusinessId | uuid | FK → Businesses. |
| StoreId | uuid | FK → Stores. |
| ProductId | text | FK → Products. |
| StockQuantity | integer | Current stock for this store. |
| ReservedQuantity | integer | Stock reserved for pending orders. |
| MinimumStock | integer | Per‑store re‑order threshold. |
| CreatedAt / UpdatedAt | timestamptz | Audit timestamps. |

**Transactions**

| Column | Type | Description |
|--------|------|-------------|
| Id | text | Legacy transaction ID. |
| BusinessId | uuid | FK → Businesses. |
| StoreId | uuid | FK → Stores. |
| TransactionNumber | text | Human‑readable number (unique). |
| CashierId | text | Auth user ID (optional). |
| CashierName | text | Human name for display. |
| StaffId | text | FK → Staff (optional). |
| CustomerId | text | FK → Customers (nullable for walk‑ins). |
| CustomerName | text | Snapshot of customer name at time of checkout. |
| OrderType | text | `dine‑in`, `takeaway`, `delivery`. |
| TableNumber | text | Optional table number. |
| PaymentMethod | text | FK → PaymentMethods. |
| PaymentStatus | text | `unpaid`, `partial`, `paid`, `refunded`, `voided`. |
| TaxRateId | uuid | FK → TaxRates (nullable for legacy). |
| Subtotal | numeric(14,2) | Sum of line totals before discount/tax. |
| DiscountTotal | numeric(14,2) | Total discount applied. |
| TaxTotal | numeric(14,2) | Tax calculated. |
| GrandTotal | numeric(14,2) | Subtotal – Discount + Tax. |
| AmountPaid | numeric(14,2) | Cash/cards received. |
| ChangeAmount | numeric(14,2) | Change returned. |
| Status | text | `completed`, `voided`, `refunded`. |
| VoidReason | text | Optional void reason. |
| CreatedAt / UpdatedAt | timestamptz | Timestamps. |

## Master Data

The migration seeds the following **minimal master data** needed for FK constraints:

1. **Businesses** – One row with ID `00000000-0000-0000-0000-000000000001` (derived from legacy `BusinessSettings`). If a `BusinessSettings` row exists, its fields are copied.
2. **Stores** – One row with ID `00000000-0000-0000-0000-000000000002` (`MAIN` store) under the default business.
3. **Roles** – Five rows: `user`, `cashier`, `manager`, `admin`, `owner` (see `Roles` table).
4. **Permissions** – Sixteen rows (see migration for exact list).
5. **RolePermissions** – Computed many‑to‑many mapping based on the permission list (owner gets all, admin drops `staff.delete`, manager drops a subset, cashier only gets `stock.adjust`, user gets none).
6. **PaymentMethods** – `cash`, `qris`, `card` (legacy transactions may have extra custom methods – those are inserted dynamically after the three).
7. **TaxRates** – One row (`Id` = `...003`) with rate pulled from legacy `BusinessSettings.TaxRate` (default `0.10`). Marked as default.
8. **ReceiptSettings** – One row (`Id` = `...004`) using legacy `BusinessSettings` data for header/footer.
9. **StoreSettings** – One row (`Id` = `...005`) pulling thresholds/tax from legacy `BusinessSettings`.

All seed data is inserted **conditionally** (`ON CONFLICT DO NOTHING`) so that an existing production DB is not corrupted if the migration is run multiple times (e.g., after a rollback).

After the migration, the application’s `bun run db:seed` command will populate **demo‑like data** (categories, products, customers, staff, transactions, movements) for development purposes. This is **separate** from the master data above and is **not required** for production.

## Integrity Rules

- **FK validity** – All FKs reference existing rows. The migration inserts master data first, then backfills legacy rows, ensuring referential integrity before FK constraints are added.
- **Money and quantity non‑negativity** – CHECK constraints on all numeric amount fields and stock quantities; enforced at the DB level.
- **Status enumerations** – Each entity’s `Status`/`MovementType`/`PaymentStatus` fields are validated against allowed lists.
- **Data normalization** – `Products.StockQuantity` is kept in sync with `Inventory` via application logic; the DB does not enforce this.
- **Soft‑delete** – Rows with `DeletedAt` populated are ignored by business queries (the application filters them out). No FK `ON DELETE` actions are taken.
- **UserProfiles role** – If a legacy profile references a role that does not exist (should not happen), it is normalized to `user`.
- **StockMovements orphan handling** – Legacy stock movements referencing deleted products are migrated by setting `ProductId` to `NULL` (allowed by `ON DELETE SET NULL` FK). This preserves history.

## Migration Guide

1. **Backup** – Export the current `niraya` schema and data (e.g., `pg_dump`).
2. **Create dev branch** – In the Neon console, fork a new branch from `production`.
3. **Connect** – Use a connection string scoped to the new branch.
4. **Apply migration** – Run `drizzle/0001_pascalcase_schema.sql`. Wait for completion.
5. **Seed master data** – Run `bun run db:seed`? Actually, the migration already seeds master data (see **Master Data** section). If you run the application’s seed, it will add demo data (categories, products, customers, staff, transactions, movements) for development purposes. **Production environments should skip demo seed**.
6. **Verify** – Run the application’s test suite (`bun test`) to ensure checkout, staff, and other endpoints work.
7. **Post‑migration checks** –
   - Ensure `auth.UserProfiles` rows have correct `Role` FK.
   - Verify `Transactions.TaxRateId` is populated (default rate).
   - Check that `Inventory` rows exist for all products.
   - Confirm that `StockMovements.ProductId` has no invalid references.
8. **Replace production** – If validation passes, promote the dev branch to production.

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Orphan `StockMovements.ProductId` | Data loss | Migrate to NULL before adding FK. |
| Legacy `UserProfiles.Role` mismatch | FK error | Normalize to `user` if role missing. |
| Duplicate `PaymentMethods` | Constraint error | Use `ON CONFLICT DO NOTHING`. |
| `BusinessSettings` missing data | NULL FK errors | Use `COALESCE` and fallback defaults. |
| `BusinessSettings` missing data | NULL FK errors | Use `COALESCE` and fallback defaults. |
| `BusinessSettings` missing data | NULL FK errors | Use `COALESCE` and fallback defaults. |
| `BusinessSettings` missing data | NULL FK errors | Use `COALESCE` and fallback defaults. |

## Next Steps

After applying the migration and verifying integrity:

1. Run the application’s seed (`bun run db:seed`) **only** in non‑production environments to populate demo data for development.
2. Deploy the updated code to production (the migration and the new schema).
3. Monitor the checkout and staff endpoints for any regressions.
4. Create a rollback plan (the old 0000 migration can be kept, but **do not drop any business tables**).

---

*Generated by the NIRAYA POS schema migration toolkit.*

---

## Mermaid ERD

```mermaid
erDiagram {
  Business --o "0..n" Stores : has
  Business --o "0..n" Staff : employs
  Business --o "0..n" Products : catalogs
  Business --o "0..n" Categories : groups
  Business --o "0..1" BusinessSettings : configures
  Business --o "0..n" TaxRates : defines
  Business --o "0..n" Discounts : defines

  Store --o "0..n" Inventory : holds
  Product "0..*" --> "0..1" Categories : belongs
  Product "0..*" --> "0..1" Inventory : authoritative
  Product "0..*" --> "0..1" StockMovements : for product

  Staff "0..*" --> "0..1" Roles : has role
  Staff "0..*" --> "1" Stores : assigned store

  Customer "0..*" --> "0..1" Business : belongs
  Customer "0..*" --> "0..*" CustomerAddresses : contacts

  Transactions "0..*" --> "1" Staff : cashier
  Transactions "0..*" --> "0..1" Customer : customer
  Transactions "0..*" --> "1" Store : at store
  Transactions "0..*" --> "0..1" PaymentMethods : via
  Transactions "0..*" --> "0..1" TaxRates : tax rate
  TransactionItems "0..*" --> "1" Transactions : item of
  TransactionItems "0..*" --> "1" Products : item of

  Payments "0..*" --> "1" Transactions : records
  Payments "0..*" --> "1" PaymentMethods : method

  StockMovements "0..*" --> "1" Products : for product
  StockMovements "0..*" --> "1" Staff : by staff
  StockMovements "0..*" --> "1" Store : at store
  StockMovements "0..*" --> "0..1" Transactions : reference

  UserProfiles "0..*" --> "0..1" Roles : role

  class Business {
    OwnerUserId
  }
  class Roles {
    Rank
  }
  class Products {
    Sku
    StockQuantity
    MinimumStock
  }
  class Inventory {
    StockQuantity
    ReservedQuantity
    MinimumStock
  }
  class Transactions {
    TransactionNumber
    PaymentStatus
  }
  class Staff {
    UserId
    StoreId
  }
}
```

---

*Documentation generated on 2026-11-04.*