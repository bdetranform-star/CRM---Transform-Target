-- CreateEnum
CREATE TYPE "ChannelTag" AS ENUM ('EMAIL_CHANNEL', 'LINKEDIN_CHANNEL', 'COLD_CALLING_CHANNEL', 'TEXT_WHATSAPP_CHANNEL');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "channelTags" "ChannelTag"[] DEFAULT ARRAY[]::"ChannelTag"[];
