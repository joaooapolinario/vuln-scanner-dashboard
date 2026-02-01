-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('NETWORK', 'WEB');

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "type" "ScanType" NOT NULL DEFAULT 'NETWORK';
