-- migration
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS products;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS customers;
CREATE SCHEMA IF NOT EXISTS staff;
CREATE SCHEMA IF NOT EXISTS suppliers;
CREATE SCHEMA IF NOT EXISTS purchases;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS lookups;
CREATE SCHEMA IF NOT EXISTS settings;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS demo;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Businesses','Stores','Roles','Permissions','RolePermissions') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA core;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Categories','Products','ProductPrices','ProductVariants','ProductBundles','ProductUnits','ProductBarcodes') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA products;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Inventory','StockMovements','StockAdjustments','Warehouses') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA inventory;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Customers','CustomerAddresses','CustomerGroups','LoyaltyAccounts','LoyaltyTransactions') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA customers;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Staff','Shifts','Attendance','Commissions') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA staff;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Suppliers','SupplierContacts') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA suppliers;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Purchases','PurchaseItems','PurchasePayments') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA purchases;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Transactions','TransactionItems','CheckoutIdempotency') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA transactions;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('Payments','PaymentMethodsTransactions') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA payments;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('PaymentMethods','TaxRates','Discounts') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA lookups;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('BusinessSettings','ReceiptSettings','StoreSettings','SystemSettings') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA settings;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='niraya' AND tablename IN ('AuditLogs','Notifications') LOOP
    BEGIN EXECUTE format('ALTER TABLE niraya."%s" SET SCHEMA audit;', rec.tablename); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;
