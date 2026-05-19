-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN "rejectionReason" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "agreedTermsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'user'
);
INSERT INTO "new_users" ("agreedTermsAt", "createdAt", "email", "id", "isActive", "name", "passwordHash", "profileImageUrl", "updatedAt") SELECT "agreedTermsAt", "createdAt", "email", "id", "isActive", "name", "passwordHash", "profileImageUrl", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
