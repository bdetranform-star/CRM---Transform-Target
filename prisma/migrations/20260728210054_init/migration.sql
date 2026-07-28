-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "company" TEXT,
    "contactOwner" TEXT NOT NULL,
    "leadStatus" TEXT NOT NULL DEFAULT 'OPEN_PROSPECT',
    "industry" TEXT NOT NULL DEFAULT 'OTHER',
    "industryDetail" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT 'OTHER',
    "sequenceStep" INTEGER NOT NULL DEFAULT 0,
    "smsOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Touch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "outcome" TEXT,
    "body" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Touch_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
