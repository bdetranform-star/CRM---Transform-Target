import { PrismaClient, Industry, LeadSource, LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const OWNER_FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery",
  "Cameron", "Drew", "Reese", "Skyler", "Peyton", "Quinn", "Rowan", "Sage",
  "Emerson", "Finley", "Harper", "Hayden",
];
const OWNER_LAST_NAMES = [
  "Bennett", "Carter", "Diaz", "Ellis", "Foster", "Grant", "Hayes", "Irwin",
  "Jenkins", "Kim", "Lewis", "Marsh", "Nolan", "Ortiz", "Parker", "Quinn",
  "Reyes", "Sanders", "Turner", "Vance",
];
const OWNER_DOMAINS = [
  "transformtargets-mail.com",
  "transformtargets-outreach.com",
  "transformtargets-sales.com",
  "transformtargets-connect.com",
  "transformtargets-growth.com",
];

function buildSeedOwners(count: number): string[] {
  const owners = new Set<string>();
  let i = 0;
  while (owners.size < count) {
    const first = OWNER_FIRST_NAMES[i % OWNER_FIRST_NAMES.length];
    const last = OWNER_LAST_NAMES[Math.floor(i / OWNER_FIRST_NAMES.length) % OWNER_LAST_NAMES.length];
    const domain = OWNER_DOMAINS[i % OWNER_DOMAINS.length];
    const suffix = Math.floor(i / (OWNER_FIRST_NAMES.length * OWNER_LAST_NAMES.length));
    const local = `${first.toLowerCase()}.${last.toLowerCase()}${suffix > 0 ? suffix : ""}`;
    owners.add(`${local}@${domain}`);
    i++;
  }
  return Array.from(owners);
}

const SAMPLE_LEADS: Array<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  company: string;
  industry: Industry;
  industryDetail: string;
  leadSource: LeadSource;
  leadStatus: LeadStatus;
  sequenceStep: number;
}> = [
  {
    firstName: "Diane",
    lastName: "Holcomb",
    email: "diane.holcomb@brightfacilities.com",
    phone: "+1-312-555-0142",
    linkedinUrl: "https://www.linkedin.com/in/diane-holcomb",
    company: "Bright Facilities Group",
    industry: Industry.IFM,
    industryDetail: "National IFM provider, 40+ regional accounts",
    leadSource: LeadSource.COLD_EMAIL,
    leadStatus: LeadStatus.OPEN_PROSPECT,
    sequenceStep: 0,
  },
  {
    firstName: "Marcus",
    lastName: "Tran",
    email: "marcus.tran@apexjanitorial.com",
    phone: "+1-404-555-0198",
    linkedinUrl: "https://www.linkedin.com/in/marcus-tran",
    company: "Apex Janitorial Services",
    industry: Industry.JANITORIAL_CLEANING,
    industryDetail: "Focused on healthcare & lab cleanrooms",
    leadSource: LeadSource.LINKEDIN,
    leadStatus: LeadStatus.SDR_IN_PROCESS,
    sequenceStep: 1,
  },
  {
    firstName: "Priya",
    lastName: "Natarajan",
    email: "priya.natarajan@coldchainhvac.com",
    phone: "+1-214-555-0177",
    linkedinUrl: "https://www.linkedin.com/in/priya-natarajan",
    company: "ColdChain HVAC Solutions",
    industry: Industry.HVAC,
    industryDetail: "Cold storage & refrigeration HVAC retrofits",
    leadSource: LeadSource.COLD_CALL,
    leadStatus: LeadStatus.EMAIL_SENT,
    sequenceStep: 1,
  },
  {
    firstName: "Wes",
    lastName: "Okafor",
    email: "wes.okafor@guardianfireprotect.com",
    phone: "+1-702-555-0110",
    linkedinUrl: "https://www.linkedin.com/in/wes-okafor",
    company: "Guardian Fire Protection",
    industry: Industry.FIRE_PROTECTION,
    industryDetail: "Sprinkler inspection & code compliance",
    leadSource: LeadSource.REFERRAL,
    leadStatus: LeadStatus.CONNECTED,
    sequenceStep: 2,
  },
  {
    firstName: "Lena",
    lastName: "Grzywacz",
    email: "lena.grzywacz@summitfacilitymgmt.com",
    phone: "+1-503-555-0163",
    linkedinUrl: "https://www.linkedin.com/in/lena-grzywacz",
    company: "Summit Facility Management",
    industry: Industry.FACILITY_MANAGEMENT,
    industryDetail: "Multi-site corporate campuses, PNW",
    leadSource: LeadSource.EVENT,
    leadStatus: LeadStatus.BAD_TIMING,
    sequenceStep: 3,
  },
  {
    firstName: "Ray",
    lastName: "Dominguez",
    email: "ray.dominguez@precisionmaintenance.com",
    phone: "+1-619-555-0184",
    linkedinUrl: "https://www.linkedin.com/in/ray-dominguez",
    company: "Precision Facility Maintenance",
    industry: Industry.FACILITY_MAINTENANCE,
    industryDetail: "Preventive maintenance contracts, retail chains",
    leadSource: LeadSource.INBOUND,
    leadStatus: LeadStatus.NOT_INTERESTED,
    sequenceStep: 4,
  },
];

async function main() {
  console.log("Seeding contactOwner pool...");
  const owners = buildSeedOwners(100);

  console.log("Seeding demo login user...");
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@transformtargets.com" },
    update: {},
    create: {
      email: "admin@transformtargets.com",
      name: "Admin",
      password: passwordHash,
    },
  });

  console.log("Seeding sample contacts...");
  for (let i = 0; i < SAMPLE_LEADS.length; i++) {
    const lead = SAMPLE_LEADS[i];
    const contact = await prisma.contact.upsert({
      where: { email: lead.email },
      update: {},
      create: {
        ...lead,
        contactOwner: owners[i % owners.length],
      },
    });

    // Give each seeded contact a small, plausible touch history.
    const existingTouches = await prisma.touch.count({ where: { contactId: contact.id } });
    if (existingTouches === 0) {
      await prisma.touch.create({
        data: {
          contactId: contact.id,
          channel: "EMAIL",
          direction: "OUTBOUND",
          outcome: "SENT",
          body: `Intro email sent to ${lead.firstName} at ${lead.company}.`,
        },
      });
      if (lead.sequenceStep >= 1) {
        await prisma.touch.create({
          data: {
            contactId: contact.id,
            channel: "LINKEDIN",
            direction: "OUTBOUND",
            outcome: "CONNECTION_SENT",
            body: "Sent LinkedIn connection request.",
          },
        });
      }
      if (lead.sequenceStep >= 2) {
        await prisma.touch.create({
          data: {
            contactId: contact.id,
            channel: "CALL",
            direction: "OUTBOUND",
            outcome: "CONNECTED",
            body: "Quick intro call, discussed current IFM vendor pain points.",
          },
        });
      }
      if (lead.sequenceStep >= 3) {
        await prisma.touch.create({
          data: {
            contactId: contact.id,
            channel: "SMS",
            direction: "OUTBOUND",
            outcome: "SENT",
            body: `Hi ${lead.firstName}, following up from our call re: ${lead.company}.`,
          },
        });
      }
    }
  }

  console.log("Seeding default SMS templates...");
  const templates = [
    {
      name: "Post-call follow-up",
      body: "Hi {{firstName}}, great chatting today about {{company}}'s facility needs. I'll send over the details we discussed shortly!",
    },
    {
      name: "Cold intro",
      body: "Hi {{firstName}}, this is Transform Targets reaching out re: {{industryDetail}} at {{company}}. Worth a quick call this week?",
    },
    {
      name: "Breakup / last touch",
      body: "Hi {{firstName}}, haven't heard back so I'll close the loop here. Reply anytime if {{company}}'s needs change!",
    },
  ];
  for (const t of templates) {
    const existing = await prisma.smsTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.smsTemplate.create({ data: t });
    }
  }

  console.log(`Done. Seeded ${SAMPLE_LEADS.length} contacts and ${owners.length} contact-owner emails.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
