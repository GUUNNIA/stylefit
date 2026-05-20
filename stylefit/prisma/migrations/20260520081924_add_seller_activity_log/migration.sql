-- CreateTable
CREATE TABLE "seller_activity_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerProfileId" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_activity_logs_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "seller_activity_logs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "seller_activity_logs_sellerProfileId_createdAt_idx" ON "seller_activity_logs"("sellerProfileId", "createdAt");
