-- RenameEnumValue: TeamMember roster replaced with real names. Renaming (not
-- dropping+adding) preserves every existing Contact.contactOwner/Task.assignedTo
-- assignment automatically -- a contact owned by the old "SAAD_AHMED" placeholder
-- is now owned by "ZOHAIR_PARACHA", with no data loss or backfill needed.
ALTER TYPE "TeamMember" RENAME VALUE 'SAAD_AHMED' TO 'ZOHAIR_PARACHA';
ALTER TYPE "TeamMember" RENAME VALUE 'SHARMIN' TO 'MUHAMMAD_SOHAIB';
ALTER TYPE "TeamMember" RENAME VALUE 'MUHAMMAD_NAUMAN' TO 'AMMAR_PARACHA';
ALTER TYPE "TeamMember" RENAME VALUE 'SALMAN' TO 'MUHAMMAD_UMER';
ALTER TYPE "TeamMember" RENAME VALUE 'SHAHMIR' TO 'GHULAM_HUSSAIN';

-- AddEnumValue: the remaining 6 new team members, with no old equivalent.
ALTER TYPE "TeamMember" ADD VALUE 'YASIR_AHMAD';
ALTER TYPE "TeamMember" ADD VALUE 'ZAINAB_PARACHA';
ALTER TYPE "TeamMember" ADD VALUE 'FARAZ_HUSSAIN';
ALTER TYPE "TeamMember" ADD VALUE 'MUHAMMAD_SUFYAN';
ALTER TYPE "TeamMember" ADD VALUE 'AMIR_BALLI';
ALTER TYPE "TeamMember" ADD VALUE 'SALMAN_IBAD';

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('USA', 'AU', 'CA', 'UK');

-- CreateEnum
CREATE TYPE "LinkedinResponseType" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'BAD_TIMING');

-- AlterTable: "LinkedIn Connection Breakdown" property group, all nullable.
ALTER TABLE "Contact" ADD COLUMN     "linkedinRegion" "Region",
ADD COLUMN     "linkedinRequestSent" BOOLEAN,
ADD COLUMN     "linkedinRequestAccepted" BOOLEAN,
ADD COLUMN     "linkedinResponse" BOOLEAN,
ADD COLUMN     "linkedinMeetingBooked" BOOLEAN,
ADD COLUMN     "linkedinResponseType" "LinkedinResponseType";
