-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('OPEN_PROSPECT', 'SDR_IN_PROCESS', 'EMAIL_SENT', 'CONNECTED', 'BAD_TIMING', 'NOT_INTERESTED', 'DEAD_LEAD', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('IFM', 'FACILITY_MANAGEMENT', 'FACILITY_SERVICES', 'FACILITY_MAINTENANCE', 'JANITORIAL_CLEANING', 'HVAC', 'FIRE_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('COLD_EMAIL', 'LINKEDIN', 'COLD_CALL', 'SMS', 'REFERRAL', 'INBOUND', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'LINKEDIN', 'CALL', 'SMS', 'NOTE');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "company" TEXT,
    "contactOwner" TEXT NOT NULL,
    "leadStatus" "LeadStatus" NOT NULL DEFAULT 'OPEN_PROSPECT',
    "industry" "Industry" NOT NULL DEFAULT 'OTHER',
    "industryDetail" TEXT,
    "leadSource" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "sequenceStep" INTEGER NOT NULL DEFAULT 0,
    "smsOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Touch" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "direction" "Direction" NOT NULL,
    "outcome" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Touch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_leadStatus_idx" ON "Contact"("leadStatus");

-- CreateIndex
CREATE INDEX "Contact_industry_idx" ON "Contact"("industry");

-- CreateIndex
CREATE INDEX "Contact_contactOwner_idx" ON "Contact"("contactOwner");

-- CreateIndex
CREATE INDEX "Contact_sequenceStep_idx" ON "Contact"("sequenceStep");

-- CreateIndex
CREATE INDEX "Touch_contactId_idx" ON "Touch"("contactId");

-- CreateIndex
CREATE INDEX "Touch_channel_idx" ON "Touch"("channel");

-- AddForeignKey
ALTER TABLE "Touch" ADD CONSTRAINT "Touch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
