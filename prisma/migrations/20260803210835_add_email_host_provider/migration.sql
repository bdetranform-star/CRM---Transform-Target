-- CreateEnum
CREATE TYPE "EmailHostProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'OTHER');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "emailHostProvider" "EmailHostProvider";
