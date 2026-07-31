-- CreateEnum
CREATE TYPE "LinkedinConnectionStatus" AS ENUM ('NOT_SENT', 'REQUEST_SENT', 'PENDING', 'CONNECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LinkedinLifecycleStage" AS ENUM ('NOT_CONTACTED', 'CONNECTION_SENT', 'CONNECTED', 'FOLLOW_UP_IN_PROGRESS', 'INTERESTED', 'NOT_INTERESTED');

-- CreateEnum
CREATE TYPE "InterestedResponseChannel" AS ENUM ('EMAIL', 'LINKEDIN', 'CALLING', 'TEXT');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "interestedResponseFrom" "InterestedResponseChannel",
ADD COLUMN     "linkedinConnectionStatus" "LinkedinConnectionStatus",
ADD COLUMN     "linkedinFollowUp1" BOOLEAN,
ADD COLUMN     "linkedinFollowUp2" BOOLEAN,
ADD COLUMN     "linkedinFollowUp3" BOOLEAN,
ADD COLUMN     "linkedinFollowUp4" BOOLEAN,
ADD COLUMN     "linkedinLifecycleStage" "LinkedinLifecycleStage",
ADD COLUMN     "linkedinPitchNote" TEXT;

-- CreateIndex
CREATE INDEX "Contact_linkedinLifecycleStage_idx" ON "Contact"("linkedinLifecycleStage");
