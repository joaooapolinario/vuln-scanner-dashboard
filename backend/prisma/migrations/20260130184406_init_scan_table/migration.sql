-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "portRange" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "logs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);
