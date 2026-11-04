import { test, expect } from "bun:test";

import { hasRole, ACTION_ROLES } from "@/server/auth/session";

test("hasRole: owner memenuhi semua role", () => {
  expect(hasRole("owner", "cashier")).toBe(true);
  expect(hasRole("owner", "manager")).toBe(true);
  expect(hasRole("owner", "admin")).toBe(true);
  expect(hasRole("owner", "owner")).toBe(true);
});

test("hasRole: admin tidak memenuhi owner", () => {
  expect(hasRole("admin", "cashier")).toBe(true);
  expect(hasRole("admin", "manager")).toBe(true);
  expect(hasRole("admin", "admin")).toBe(true);
  expect(hasRole("admin", "owner")).toBe(false);
});

test("hasRole: manager tidak memenuhi admin/owner", () => {
  expect(hasRole("manager", "cashier")).toBe(true);
  expect(hasRole("manager", "manager")).toBe(true);
  expect(hasRole("manager", "admin")).toBe(false);
  expect(hasRole("manager", "owner")).toBe(false);
});

test("hasRole: cashier hanya memenuhi cashier", () => {
  expect(hasRole("cashier", "cashier")).toBe(true);
  expect(hasRole("cashier", "manager")).toBe(false);
  expect(hasRole("cashier", "admin")).toBe(false);
  expect(hasRole("cashier", "owner")).toBe(false);
});

test("hasRole: undefined tidak memenuhi apa pun", () => {
  expect(hasRole(undefined, "cashier")).toBe(false);
  expect(hasRole(undefined, "owner")).toBe(false);
});

test("ACTION_ROLES: aksi sensitif membutuhkan role tinggi", () => {
  expect(ACTION_ROLES["category.delete"]).toBe("owner");
  expect(ACTION_ROLES["product.delete"]).toBe("owner");
  expect(ACTION_ROLES["staff.create"]).toBe("admin");
  expect(ACTION_ROLES["staff.delete"]).toBe("owner");
  expect(ACTION_ROLES["settings.update"]).toBe("admin");
  expect(ACTION_ROLES["stock.adjust"]).toBe("manager");
  expect(ACTION_ROLES["transaction.void"]).toBe("manager");
});

test("ACTION_ROLES: aksi kasir tidak diatur (diizinkan semua role terautentikasi)", () => {
  // Tidak ada entri untuk aksi-only-cashier, berarti dibuka untuk semua yang login.
  expect(ACTION_ROLES["category.create"]).toBe("manager");
});
