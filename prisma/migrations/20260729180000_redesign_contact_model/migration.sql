-- Redesign the Contact model to match the HubSpot-style CRM upgrade:
-- new fields, replaced LeadStatus/Industry enums, contactOwner moving from
-- free-text sending-account emails to named team members, and new
-- Deal/Task models. Old data is preserved and remapped wherever a sensible
-- mapping exists; see CLAUDE.md for the documented mapping tables.

-- ============================================================
-- 1. New enum types that don't replace an existing one
-- ============================================================
CREATE TYPE "TeamMember" AS ENUM ('SAAD_AHMED', 'SHARMIN', 'MUHAMMAD_NAUMAN', 'SALMAN', 'SHAHMIR');
CREATE TYPE "LifecycleStage" AS ENUM ('SUBSCRIBER', 'LEAD', 'MARKETING_QUALIFIED_LEAD', 'SALES_QUALIFIED_LEAD', 'OPPORTUNITY', 'CUSTOMER');
CREATE TYPE "IndustryDetail" AS ENUM ('HVAC', 'ELECTRICAL', 'PLUMBING', 'ROOFING', 'HANDYMAN', 'JANITORIAL', 'LANDSCAPING', 'PEST_CONTROL', 'SECURITY', 'COMMERCIAL_OFFICES', 'INDUSTRIAL_MANUFACTURING', 'RETAIL_CHAINS', 'EDUCATIONAL_CAMPUSES', 'QSR_FAST_FOOD', 'CASUAL_DINING', 'MULTI_BRAND_OPERATOR', 'FREIGHT_BROKERAGE_3PL', 'ASSET_BASED_FLEET', 'WAREHOUSING', 'LAST_MILE_DELIVERY', 'COMMERCIAL', 'RESIDENTIAL', 'INFRASTRUCTURE', 'SPECIALTY_SUBCONTRACTOR', 'URGENT_CARE_CHAINS', 'HOSPITALS', 'MULTI_SPECIALTY_CLINICS', 'SENIOR_LIVING_FACILITIES');
CREATE TYPE "LeadSourceCaptured" AS ENUM ('LINKEDIN_SALES_NAVIGATOR', 'GOOGLE_MAPS', 'GOOGLE_DORK', 'ONLINE_DIRECTORY');
CREATE TYPE "DealStage" AS ENUM ('NEW', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');

-- ============================================================
-- 2. Rename phone -> workPhone (straight rename, no data loss)
-- ============================================================
ALTER TABLE "Contact" RENAME COLUMN "phone" TO "workPhone";

-- ============================================================
-- 3. Add all the new plain columns
-- ============================================================
ALTER TABLE "Contact"
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "cellPhone" TEXT,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "websiteTraffic" INTEGER,
  ADD COLUMN "numberOfEmployees" INTEGER,
  ADD COLUMN "streetAddress" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "zipCode" TEXT,
  ADD COLUMN "lastInterestedReply" TIMESTAMP(3),
  ADD COLUMN "lastContactDate" TIMESTAMP(3),
  ADD COLUMN "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'LEAD',
  ADD COLUMN "leadSourceCaptured" "LeadSourceCaptured";

-- Backfill lastContactDate / lastInterestedReply from existing Touch history
-- rather than leaving them null for contacts that already have activity.
UPDATE "Contact" c
SET "lastContactDate" = t."lastTouch"
FROM (
  SELECT "contactId", MAX("createdAt") AS "lastTouch"
  FROM "Touch"
  GROUP BY "contactId"
) t
WHERE t."contactId" = c."id";

UPDATE "Contact" c
SET "lastInterestedReply" = t."lastInterested"
FROM (
  SELECT "contactId", MAX("createdAt") AS "lastInterested"
  FROM "Touch"
  WHERE "outcome" IN ('CONNECTED', 'REPLIED')
  GROUP BY "contactId"
) t
WHERE t."contactId" = c."id";

-- ============================================================
-- 4. LeadStatus: replace enum, remapping every existing value
--    Mapping (documented in CLAUDE.md):
--      OPEN_PROSPECT   -> OPEN_PROSPECT   (unchanged)
--      SDR_IN_PROCESS  -> IN_PROCESS
--      EMAIL_SENT      -> EMAIL_SENT      (unchanged)
--      CONNECTED       -> CONNECTED       (unchanged)
--      BAD_TIMING      -> DEAD_LEAD
--      NOT_INTERESTED  -> DEAD_LEAD
--      DEAD_LEAD       -> DEAD_LEAD       (unchanged)
--      DUPLICATE       -> DEAD_LEAD
--    New values (OPEN_OPPORTUNITIES, CURRENT_CUSTOMER, CHURNED, NEW_LEAD)
--    have no old equivalent; NEW_LEAD becomes the default for contacts
--    created from now on, not retroactively applied to existing contacts.
-- ============================================================
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW_LEAD', 'OPEN_PROSPECT', 'IN_PROCESS', 'EMAIL_SENT', 'CONNECTED', 'OPEN_OPPORTUNITIES', 'CURRENT_CUSTOMER', 'CHURNED', 'DEAD_LEAD');

ALTER TABLE "Contact" ADD COLUMN "leadStatusNew" "LeadStatus_new";

UPDATE "Contact" SET "leadStatusNew" = CASE "leadStatus"::text
  WHEN 'OPEN_PROSPECT'  THEN 'OPEN_PROSPECT'
  WHEN 'SDR_IN_PROCESS' THEN 'IN_PROCESS'
  WHEN 'EMAIL_SENT'     THEN 'EMAIL_SENT'
  WHEN 'CONNECTED'      THEN 'CONNECTED'
  WHEN 'BAD_TIMING'     THEN 'DEAD_LEAD'
  WHEN 'NOT_INTERESTED' THEN 'DEAD_LEAD'
  WHEN 'DEAD_LEAD'      THEN 'DEAD_LEAD'
  WHEN 'DUPLICATE'      THEN 'DEAD_LEAD'
END::"LeadStatus_new";

ALTER TABLE "Contact" ALTER COLUMN "leadStatusNew" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "leadStatus" DROP DEFAULT;
ALTER TABLE "Contact" DROP COLUMN "leadStatus";
ALTER TABLE "Contact" RENAME COLUMN "leadStatusNew" TO "leadStatus";
ALTER TABLE "Contact" ALTER COLUMN "leadStatus" SET DEFAULT 'NEW_LEAD';
DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
CREATE INDEX "Contact_leadStatus_idx" ON "Contact"("leadStatus");

-- ============================================================
-- 5. Industry: replace enum, remapping every existing value
--    Mapping (documented in CLAUDE.md):
--      IFM                 -> INTEGRATED_FACILITY_MANAGEMENT
--      FACILITY_MANAGEMENT -> INTEGRATED_FACILITY_MANAGEMENT
--      FACILITY_SERVICES   -> FACILITY_MAINTENANCE_COMPANIES
--      FACILITY_MAINTENANCE-> FACILITY_MAINTENANCE_COMPANIES
--      JANITORIAL_CLEANING -> FACILITY_MAINTENANCE_COMPANIES (granularity now in industryDetail)
--      HVAC                -> FACILITY_MAINTENANCE_COMPANIES (granularity now in industryDetail)
--      FIRE_PROTECTION      -> FACILITY_MAINTENANCE_COMPANIES (no matching industryDetail value)
--      OTHER                -> FACILITY_MAINTENANCE_COMPANIES (fallback)
-- ============================================================
CREATE TYPE "Industry_new" AS ENUM ('FACILITY_MAINTENANCE_COMPANIES', 'INTEGRATED_FACILITY_MANAGEMENT', 'MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS', 'TRANSPORTATION_LOGISTICS', 'CONSTRUCTION_COMPANIES', 'HEALTHCARE_FACILITIES');

ALTER TABLE "Contact" ADD COLUMN "industryNew" "Industry_new";

UPDATE "Contact" SET "industryNew" = CASE "industry"::text
  WHEN 'IFM'                  THEN 'INTEGRATED_FACILITY_MANAGEMENT'
  WHEN 'FACILITY_MANAGEMENT'  THEN 'INTEGRATED_FACILITY_MANAGEMENT'
  WHEN 'FACILITY_SERVICES'    THEN 'FACILITY_MAINTENANCE_COMPANIES'
  WHEN 'FACILITY_MAINTENANCE' THEN 'FACILITY_MAINTENANCE_COMPANIES'
  WHEN 'JANITORIAL_CLEANING'  THEN 'FACILITY_MAINTENANCE_COMPANIES'
  WHEN 'HVAC'                 THEN 'FACILITY_MAINTENANCE_COMPANIES'
  WHEN 'FIRE_PROTECTION'      THEN 'FACILITY_MAINTENANCE_COMPANIES'
  WHEN 'OTHER'                THEN 'FACILITY_MAINTENANCE_COMPANIES'
END::"Industry_new";

ALTER TABLE "Contact" ALTER COLUMN "industryNew" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "industry" DROP DEFAULT;
ALTER TABLE "Contact" DROP COLUMN "industry";
ALTER TABLE "Contact" RENAME COLUMN "industryNew" TO "industry";
ALTER TABLE "Contact" ALTER COLUMN "industry" SET DEFAULT 'FACILITY_MAINTENANCE_COMPANIES';
DROP TYPE "Industry";
ALTER TYPE "Industry_new" RENAME TO "Industry";
CREATE INDEX "Contact_industry_idx" ON "Contact"("industry");

-- ============================================================
-- 6. industryDetail: free text -> fixed enum. There's no reliable general
--    mapping from arbitrary free text to a fixed category list, so this is
--    intentionally best-effort keyword matching (documented in CLAUDE.md);
--    anything that doesn't match a keyword is set to NULL rather than
--    guessed. Old text is not otherwise recoverable after this migration.
-- ============================================================
ALTER TABLE "Contact" ADD COLUMN "industryDetailNew" "IndustryDetail";

UPDATE "Contact" SET "industryDetailNew" = 'HVAC'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%hvac%';
UPDATE "Contact" SET "industryDetailNew" = 'JANITORIAL'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%janitorial%' OR "industryDetail" ILIKE '%cleaning%' OR "industryDetail" ILIKE '%cleanroom%');
UPDATE "Contact" SET "industryDetailNew" = 'ELECTRICAL'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%electrical%';
UPDATE "Contact" SET "industryDetailNew" = 'PLUMBING'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%plumbing%';
UPDATE "Contact" SET "industryDetailNew" = 'ROOFING'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%roofing%';
UPDATE "Contact" SET "industryDetailNew" = 'LANDSCAPING'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%landscap%';
UPDATE "Contact" SET "industryDetailNew" = 'PEST_CONTROL'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%pest%';
UPDATE "Contact" SET "industryDetailNew" = 'SECURITY'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%security%';
UPDATE "Contact" SET "industryDetailNew" = 'COMMERCIAL_OFFICES'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%office%' OR "industryDetail" ILIKE '%corporate campus%');
UPDATE "Contact" SET "industryDetailNew" = 'INDUSTRIAL_MANUFACTURING'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%manufactur%' OR "industryDetail" ILIKE '%industrial%');
UPDATE "Contact" SET "industryDetailNew" = 'RETAIL_CHAINS'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%retail%';
UPDATE "Contact" SET "industryDetailNew" = 'EDUCATIONAL_CAMPUSES'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%school%' OR "industryDetail" ILIKE '%campus%' OR "industryDetail" ILIKE '%educat%');
UPDATE "Contact" SET "industryDetailNew" = 'QSR_FAST_FOOD'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%fast food%' OR "industryDetail" ILIKE '%qsr%');
UPDATE "Contact" SET "industryDetailNew" = 'CASUAL_DINING'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%dining%' OR "industryDetail" ILIKE '%restaurant%');
UPDATE "Contact" SET "industryDetailNew" = 'FREIGHT_BROKERAGE_3PL'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%freight%' OR "industryDetail" ILIKE '%3pl%' OR "industryDetail" ILIKE '%brokerage%');
UPDATE "Contact" SET "industryDetailNew" = 'WAREHOUSING'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%warehous%';
UPDATE "Contact" SET "industryDetailNew" = 'LAST_MILE_DELIVERY'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%delivery%';
UPDATE "Contact" SET "industryDetailNew" = 'URGENT_CARE_CHAINS'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%urgent care%';
UPDATE "Contact" SET "industryDetailNew" = 'HOSPITALS'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%hospital%';
UPDATE "Contact" SET "industryDetailNew" = 'MULTI_SPECIALTY_CLINICS'
  WHERE "industryDetailNew" IS NULL AND "industryDetail" ILIKE '%clinic%';
UPDATE "Contact" SET "industryDetailNew" = 'SENIOR_LIVING_FACILITIES'
  WHERE "industryDetailNew" IS NULL AND ("industryDetail" ILIKE '%senior living%' OR "industryDetail" ILIKE '%assisted living%');
-- Anything left unmatched (e.g. "construction", fire protection, generic
-- IFM copy) stays NULL rather than being force-fit into a wrong category.

ALTER TABLE "Contact" DROP COLUMN "industryDetail";
ALTER TABLE "Contact" RENAME COLUMN "industryDetailNew" TO "industryDetail";

-- ============================================================
-- 7. contactOwner: free-text sending-account email -> TeamMember enum.
--    There is no correspondence between the old 100 placeholder emails and
--    the 5 named team members, so existing contacts are deterministically
--    (not randomly — stable across re-runs) reassigned across the 5 names
--    by hashing the contact id. Re-assign manually afterward if a specific
--    owner mapping matters.
-- ============================================================
ALTER TABLE "Contact" ADD COLUMN "contactOwnerNew" "TeamMember";

UPDATE "Contact" SET "contactOwnerNew" = (
  ARRAY['SAAD_AHMED','SHARMIN','MUHAMMAD_NAUMAN','SALMAN','SHAHMIR']::"TeamMember"[]
)[(abs(hashtext("id")) % 5) + 1];

ALTER TABLE "Contact" ALTER COLUMN "contactOwnerNew" SET NOT NULL;
ALTER TABLE "Contact" DROP COLUMN "contactOwner";
ALTER TABLE "Contact" RENAME COLUMN "contactOwnerNew" TO "contactOwner";
CREATE INDEX "Contact_contactOwner_idx" ON "Contact"("contactOwner");

-- ============================================================
-- 8. Remaining new indexes
-- ============================================================
CREATE INDEX "Contact_lifecycleStage_idx" ON "Contact"("lifecycleStage");
CREATE INDEX "Contact_company_idx" ON "Contact"("company");

-- ============================================================
-- 9. New Deal and Task tables
-- ============================================================
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(12,2),
    "stage" "DealStage" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assignedTo" "TeamMember" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");
CREATE INDEX "Task_contactId_idx" ON "Task"("contactId");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
