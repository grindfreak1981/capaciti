-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BUYER', 'SUPPLIER', 'BOTH');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SUPPLIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'FULL');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "companyType" "CompanyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingProcess" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "manufacturingProcessId" TEXT NOT NULL,
    "description" TEXT,
    "capabilities" JSONB NOT NULL DEFAULT '{}',
    "minimumBatchSize" INTEGER,
    "maximumBatchSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineMaterial" (
    "machineId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "MachineMaterial_pkey" PRIMARY KEY ("machineId","materialId")
);

-- CreateTable
CREATE TABLE "MachineAvailability" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "status" "AvailabilityStatus" NOT NULL,
    "estimatedHours" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "manufacturingProcessId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requiredDeliveryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqFile" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfqFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "compatible" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_country_idx" ON "Company"("country");

-- CreateIndex
CREATE INDEX "Company_companyType_idx" ON "Company"("companyType");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingProcess_code_key" ON "ManufacturingProcess"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Machine_companyId_idx" ON "Machine"("companyId");

-- CreateIndex
CREATE INDEX "Machine_manufacturingProcessId_idx" ON "Machine"("manufacturingProcessId");

-- CreateIndex
CREATE INDEX "MachineMaterial_materialId_idx" ON "MachineMaterial"("materialId");

-- CreateIndex
CREATE INDEX "MachineAvailability_isoYear_isoWeek_idx" ON "MachineAvailability"("isoYear", "isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "MachineAvailability_machineId_isoYear_isoWeek_key" ON "MachineAvailability"("machineId", "isoYear", "isoWeek");

-- CreateIndex
CREATE INDEX "Rfq_companyId_idx" ON "Rfq"("companyId");

-- CreateIndex
CREATE INDEX "Rfq_manufacturingProcessId_idx" ON "Rfq"("manufacturingProcessId");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RfqFile_storageKey_key" ON "RfqFile"("storageKey");

-- CreateIndex
CREATE INDEX "RfqFile_rfqId_idx" ON "RfqFile"("rfqId");

-- CreateIndex
CREATE INDEX "MatchResult_rfqId_idx" ON "MatchResult"("rfqId");

-- CreateIndex
CREATE INDEX "MatchResult_machineId_idx" ON "MatchResult"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_rfqId_machineId_key" ON "MatchResult"("rfqId", "machineId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_manufacturingProcessId_fkey" FOREIGN KEY ("manufacturingProcessId") REFERENCES "ManufacturingProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineMaterial" ADD CONSTRAINT "MachineMaterial_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineMaterial" ADD CONSTRAINT "MachineMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineAvailability" ADD CONSTRAINT "MachineAvailability_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_manufacturingProcessId_fkey" FOREIGN KEY ("manufacturingProcessId") REFERENCES "ManufacturingProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqFile" ADD CONSTRAINT "RfqFile_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqFile" ADD CONSTRAINT "RfqFile_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
