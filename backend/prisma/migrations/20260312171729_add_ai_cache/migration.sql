-- CreateTable
CREATE TABLE "AiCache" (
    "id" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiCache_finding_key" ON "AiCache"("finding");
