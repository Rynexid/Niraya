import { createSeedData } from "../../lib/business-seed";
import { db, pool } from "./index";
import {
  categories,
  customers,
  products,
  settings,
  staff,
  stockMovements,
  transactionItems,
  transactions,
} from "./schema";

const data = createSeedData();

const money = (value: number) => value.toFixed(2);
const date = (value: string) => new Date(value);

async function seed() {
  await db.transaction(async (tx) => {
    await tx
      .insert(categories)
      .values(
        data.categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description ?? null,
          status: category.status,
          createdAt: date(category.createdAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(products)
      .values(
        data.products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? null,
          categoryId: product.categoryId,
          price: money(product.price),
          cost: money(product.cost),
          stock: product.stock,
          minStock: product.minStock,
          unit: product.unit,
          imageUrl: product.imageUrl ?? null,
          status: product.status,
          createdAt: date(product.createdAt),
          updatedAt: date(product.createdAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(customers)
      .values(
        data.customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? null,
          notes: customer.notes ?? null,
          joinedAt: date(customer.joinedAt),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(staff)
      .values(
        data.staff.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status,
          joinedAt: date(member.joinedAt),
          lastActive: member.lastActive ? date(member.lastActive) : null,
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(settings)
      .values({
        id: "default",
        businessName: data.settings.businessName,
        address: data.settings.address,
        phone: data.settings.phone,
        email: data.settings.email,
        currency: data.settings.currency,
        timezone: data.settings.timezone,
        taxRate: String(data.settings.taxRate),
        memberDiscountRate: String(data.settings.memberDiscountRate),
        lowStockThreshold: data.settings.lowStockThreshold,
        receiptFooter: data.settings.receiptFooter,
      })
      .onConflictDoNothing();

    for (const transaction of data.transactions) {
      await tx
        .insert(transactions)
        .values({
          id: transaction.id,
          number: transaction.number,
          cashierName: transaction.cashier,
          customerId: transaction.customerId ?? null,
          customerName: transaction.customerName,
          orderType: transaction.orderType,
          tableNumber: transaction.tableNumber ?? null,
          paymentMethod: transaction.paymentMethod,
          subtotal: money(transaction.subtotal),
          discount: money(transaction.discount),
          tax: money(transaction.tax),
          total: money(transaction.total),
          amountPaid:
            transaction.cashReceived != null
              ? money(transaction.cashReceived)
              : money(transaction.total),
          changeAmount:
            transaction.change != null ? money(transaction.change) : "0.00",
          status: transaction.status,
          voidReason: transaction.voidReason ?? null,
          createdAt: date(transaction.createdAt),
        })
        .onConflictDoNothing();

      if (transaction.items.length > 0) {
        await tx
          .insert(transactionItems)
          .values(
            transaction.items.map((item, index) => ({
              id: `${transaction.id}-item-${index + 1}`,
              transactionId: transaction.id,
              productId: item.productId,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: money(item.unitPrice),
              lineTotal: money(item.lineTotal),
            }))
          )
          .onConflictDoNothing();
      }
    }

    await tx
      .insert(stockMovements)
      .values(
        data.movements.map((movement) => ({
          id: movement.id,
          productId: movement.productId,
          productName: movement.productName,
          type: movement.type,
          quantity: movement.quantity,
          stockAfter: movement.stockAfter,
          note: movement.note,
          staff: movement.staff,
          createdAt: date(movement.createdAt),
        }))
      )
      .onConflictDoNothing();
  });

  console.log(
    `Seeded ${data.categories.length} categories, ${data.products.length} products, ` +
      `${data.customers.length} customers, ${data.staff.length} staff, ` +
      `${data.transactions.length} transactions, ${data.movements.length} movements.`
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
