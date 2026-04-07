-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "siteCode" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "clientName" TEXT,
    "clientMobile" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "projectType" TEXT NOT NULL DEFAULT 'house',
    "startDate" DATETIME,
    "expectedEndDate" DATETIME,
    "actualEndDate" DATETIME,
    "totalSqft" REAL NOT NULL DEFAULT 0,
    "ratePerSqft" REAL NOT NULL DEFAULT 0,
    "estimatedBudget" REAL NOT NULL DEFAULT 0,
    "estimatedMaterialCost" REAL NOT NULL DEFAULT 0,
    "estimatedLaborCost" REAL NOT NULL DEFAULT 0,
    "estimatedOtherCost" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "assignedManagerId" TEXT,
    "coverImage" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Site_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("actualEndDate", "address", "assignedManagerId", "clientMobile", "clientName", "coverImage", "createdAt", "deletedAt", "estimatedBudget", "estimatedLaborCost", "estimatedMaterialCost", "estimatedOtherCost", "expectedEndDate", "id", "latitude", "longitude", "notes", "projectType", "siteCode", "siteName", "startDate", "status", "tenantId", "updatedAt") SELECT "actualEndDate", "address", "assignedManagerId", "clientMobile", "clientName", "coverImage", "createdAt", "deletedAt", "estimatedBudget", "estimatedLaborCost", "estimatedMaterialCost", "estimatedOtherCost", "expectedEndDate", "id", "latitude", "longitude", "notes", "projectType", "siteCode", "siteName", "startDate", "status", "tenantId", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE INDEX "Site_tenantId_idx" ON "Site"("tenantId");
CREATE INDEX "Site_status_idx" ON "Site"("status");
CREATE INDEX "Site_tenantId_status_idx" ON "Site"("tenantId", "status");
CREATE UNIQUE INDEX "Site_tenantId_siteCode_key" ON "Site"("tenantId", "siteCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
