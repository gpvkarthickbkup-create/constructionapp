-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vendorId" TEXT,
    "expenseNumber" TEXT NOT NULL,
    "expenseDate" DATETIME NOT NULL,
    "expenseType" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT,
    "rate" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "gstPercent" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "dueAmount" REAL NOT NULL DEFAULT 0,
    "paymentType" TEXT,
    "billNumber" TEXT,
    "referenceNumber" TEXT,
    "dueDate" DATETIME,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ExpenseSubcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("approvalStatus", "attachmentCount", "billNumber", "categoryId", "createdAt", "createdBy", "deletedAt", "description", "dueAmount", "dueDate", "expenseDate", "expenseNumber", "expenseType", "id", "isDraft", "itemName", "paidAmount", "paymentStatus", "paymentType", "quantity", "rate", "referenceNumber", "remarks", "siteId", "subcategoryId", "tenantId", "totalAmount", "unit", "updatedAt", "updatedBy", "vendorId") SELECT "approvalStatus", "attachmentCount", "billNumber", "categoryId", "createdAt", "createdBy", "deletedAt", "description", "dueAmount", "dueDate", "expenseDate", "expenseNumber", "expenseType", "id", "isDraft", "itemName", "paidAmount", "paymentStatus", "paymentType", "quantity", "rate", "referenceNumber", "remarks", "siteId", "subcategoryId", "tenantId", "totalAmount", "unit", "updatedAt", "updatedBy", "vendorId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");
CREATE INDEX "Expense_siteId_idx" ON "Expense"("siteId");
CREATE INDEX "Expense_vendorId_idx" ON "Expense"("vendorId");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_tenantId_siteId_idx" ON "Expense"("tenantId", "siteId");
CREATE INDEX "Expense_tenantId_expenseDate_idx" ON "Expense"("tenantId", "expenseDate");
CREATE INDEX "Expense_tenantId_paymentStatus_idx" ON "Expense"("tenantId", "paymentStatus");
CREATE INDEX "Expense_tenantId_expenseType_idx" ON "Expense"("tenantId", "expenseType");
CREATE INDEX "Expense_billNumber_idx" ON "Expense"("billNumber");
CREATE UNIQUE INDEX "Expense_tenantId_expenseNumber_key" ON "Expense"("tenantId", "expenseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
