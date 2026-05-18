-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_services" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerProfileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_services" ("category", "createdAt", "description", "durationMinutes", "id", "isActive", "price", "sellerProfileId", "serviceType", "title", "updatedAt") SELECT "category", "createdAt", "description", "durationMinutes", "id", "isActive", "price", "sellerProfileId", "serviceType", "title", "updatedAt" FROM "services";
DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
