-- Replace the generic DealStage pipeline with the team's outreach-specific one.
-- Same add-new-column -> CASE-mapped backfill -> drop-old -> rename pattern
-- as the redesign migration, so every old value is mapped explicitly.
--
--   NEW, QUALIFIED              -> INTERESTED
--   PROPOSAL_SENT, NEGOTIATION  -> PROPOSAL_NEGOTIATION
--   WON                         -> CLOSED_WON
--   LOST                        -> CLOSED_LOST

CREATE TYPE "DealStage_new" AS ENUM (
  'INTERESTED',
  'MEETING_INVITE_SENT',
  'MEETING_BOOKED',
  'DEMO_COMPLETED',
  'PROPOSAL_NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST'
);

ALTER TABLE "Deal" ADD COLUMN "stage_new" "DealStage_new" NOT NULL DEFAULT 'INTERESTED';

UPDATE "Deal" SET "stage_new" = (CASE "stage"::text
  WHEN 'NEW' THEN 'INTERESTED'
  WHEN 'QUALIFIED' THEN 'INTERESTED'
  WHEN 'PROPOSAL_SENT' THEN 'PROPOSAL_NEGOTIATION'
  WHEN 'NEGOTIATION' THEN 'PROPOSAL_NEGOTIATION'
  WHEN 'WON' THEN 'CLOSED_WON'
  WHEN 'LOST' THEN 'CLOSED_LOST'
  ELSE 'INTERESTED'
END)::"DealStage_new";

ALTER TABLE "Deal" DROP COLUMN "stage";
DROP TYPE "DealStage";
ALTER TYPE "DealStage_new" RENAME TO "DealStage";
ALTER TABLE "Deal" RENAME COLUMN "stage_new" TO "stage";
