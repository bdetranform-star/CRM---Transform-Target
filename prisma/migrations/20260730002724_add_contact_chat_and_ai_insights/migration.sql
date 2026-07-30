-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "aiInsightsGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "aiInsightsSummary" TEXT;

-- CreateTable
CREATE TABLE "ContactChatMessage" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactChatMessage_contactId_idx" ON "ContactChatMessage"("contactId");

-- AddForeignKey
ALTER TABLE "ContactChatMessage" ADD CONSTRAINT "ContactChatMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
