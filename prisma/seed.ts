import {
  PrismaClient,
  Industry,
  IndustryDetail,
  LeadSource,
  LeadSourceCaptured,
  LeadStatus,
  LifecycleStage,
  TeamMember,
  DealStage,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAM_MEMBERS: TeamMember[] = [
  TeamMember.SAAD_AHMED,
  TeamMember.SHARMIN,
  TeamMember.MUHAMMAD_NAUMAN,
  TeamMember.SALMAN,
  TeamMember.SHAHMIR,
];

const SAMPLE_LEADS: Array<{
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  workPhone: string;
  linkedinUrl: string;
  company: string;
  industry: Industry;
  industryDetail: IndustryDetail | null;
  leadSource: LeadSource;
  leadSourceCaptured: LeadSourceCaptured;
  leadStatus: LeadStatus;
  lifecycleStage: LifecycleStage;
  city: string;
  state: string;
  country: string;
  numberOfEmployees: number;
  sequenceStep: number;
}> = [
  {
    firstName: "Diane",
    lastName: "Holcomb",
    jobTitle: "VP of Facilities",
    email: "diane.holcomb@brightfacilities.com",
    workPhone: "+1-312-555-0142",
    linkedinUrl: "https://www.linkedin.com/in/diane-holcomb",
    company: "Bright Facilities Group",
    industry: Industry.INTEGRATED_FACILITY_MANAGEMENT,
    industryDetail: null,
    leadSource: LeadSource.COLD_EMAIL,
    leadSourceCaptured: LeadSourceCaptured.LINKEDIN_SALES_NAVIGATOR,
    leadStatus: LeadStatus.OPEN_PROSPECT,
    lifecycleStage: LifecycleStage.LEAD,
    city: "Chicago",
    state: "IL",
    country: "USA",
    numberOfEmployees: 420,
    sequenceStep: 0,
  },
  {
    firstName: "Marcus",
    lastName: "Tran",
    jobTitle: "Operations Director",
    email: "marcus.tran@apexjanitorial.com",
    workPhone: "+1-404-555-0198",
    linkedinUrl: "https://www.linkedin.com/in/marcus-tran",
    company: "Apex Janitorial Services",
    industry: Industry.FACILITY_MAINTENANCE_COMPANIES,
    industryDetail: IndustryDetail.JANITORIAL,
    leadSource: LeadSource.LINKEDIN,
    leadSourceCaptured: LeadSourceCaptured.LINKEDIN_SALES_NAVIGATOR,
    leadStatus: LeadStatus.IN_PROCESS,
    lifecycleStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
    city: "Atlanta",
    state: "GA",
    country: "USA",
    numberOfEmployees: 180,
    sequenceStep: 1,
  },
  {
    firstName: "Priya",
    lastName: "Natarajan",
    jobTitle: "Facilities Manager",
    email: "priya.natarajan@coldchainhvac.com",
    workPhone: "+1-214-555-0177",
    linkedinUrl: "https://www.linkedin.com/in/priya-natarajan",
    company: "ColdChain HVAC Solutions",
    industry: Industry.FACILITY_MAINTENANCE_COMPANIES,
    industryDetail: IndustryDetail.HVAC,
    leadSource: LeadSource.COLD_CALL,
    leadSourceCaptured: LeadSourceCaptured.GOOGLE_MAPS,
    leadStatus: LeadStatus.EMAIL_SENT,
    lifecycleStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
    city: "Dallas",
    state: "TX",
    country: "USA",
    numberOfEmployees: 95,
    sequenceStep: 1,
  },
  {
    firstName: "Wes",
    lastName: "Okafor",
    jobTitle: "Chief Engineer",
    email: "wes.okafor@guardianfireprotect.com",
    workPhone: "+1-702-555-0110",
    linkedinUrl: "https://www.linkedin.com/in/wes-okafor",
    company: "Guardian Fire Protection",
    industry: Industry.FACILITY_MAINTENANCE_COMPANIES,
    industryDetail: null,
    leadSource: LeadSource.REFERRAL,
    leadSourceCaptured: LeadSourceCaptured.ONLINE_DIRECTORY,
    leadStatus: LeadStatus.CONNECTED,
    lifecycleStage: LifecycleStage.SALES_QUALIFIED_LEAD,
    city: "Las Vegas",
    state: "NV",
    country: "USA",
    numberOfEmployees: 60,
    sequenceStep: 2,
  },
  {
    firstName: "Lena",
    lastName: "Grzywacz",
    jobTitle: "Regional Facilities Lead",
    email: "lena.grzywacz@summitfacilitymgmt.com",
    workPhone: "+1-503-555-0163",
    linkedinUrl: "https://www.linkedin.com/in/lena-grzywacz",
    company: "Summit Facility Management",
    industry: Industry.INTEGRATED_FACILITY_MANAGEMENT,
    industryDetail: IndustryDetail.COMMERCIAL_OFFICES,
    leadSource: LeadSource.EVENT,
    leadSourceCaptured: LeadSourceCaptured.LINKEDIN_SALES_NAVIGATOR,
    leadStatus: LeadStatus.DEAD_LEAD,
    lifecycleStage: LifecycleStage.LEAD,
    city: "Portland",
    state: "OR",
    country: "USA",
    numberOfEmployees: 310,
    sequenceStep: 3,
  },
  {
    firstName: "Ray",
    lastName: "Dominguez",
    jobTitle: "Procurement Manager",
    email: "ray.dominguez@precisionmaintenance.com",
    workPhone: "+1-619-555-0184",
    linkedinUrl: "https://www.linkedin.com/in/ray-dominguez",
    company: "Precision Facility Maintenance",
    industry: Industry.FACILITY_MAINTENANCE_COMPANIES,
    industryDetail: IndustryDetail.RETAIL_CHAINS,
    leadSource: LeadSource.INBOUND,
    leadSourceCaptured: LeadSourceCaptured.GOOGLE_DORK,
    leadStatus: LeadStatus.DEAD_LEAD,
    lifecycleStage: LifecycleStage.LEAD,
    city: "San Diego",
    state: "CA",
    country: "USA",
    numberOfEmployees: 150,
    sequenceStep: 4,
  },
];

async function main() {
  if (process.env.SKIP_DEMO_SEED === "true") {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log(`Seeding admin login user (${process.env.ADMIN_EMAIL})...`);
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL },
        update: {},
        create: {
          email: process.env.ADMIN_EMAIL,
          name: "Admin",
          password: passwordHash,
        },
      });
    } else {
      console.log(
        "SKIP_DEMO_SEED is set and no ADMIN_EMAIL/ADMIN_PASSWORD provided — skipping login user entirely. " +
          "Set ADMIN_EMAIL and ADMIN_PASSWORD to seed a real admin account instead."
      );
    }
  } else {
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
  }

  console.log("Seeding sample contacts...");
  const contactIds: string[] = [];
  for (let i = 0; i < SAMPLE_LEADS.length; i++) {
    const lead = SAMPLE_LEADS[i];
    const contact = await prisma.contact.upsert({
      where: { email: lead.email },
      update: {},
      create: {
        ...lead,
        country: lead.country,
        contactOwner: TEAM_MEMBERS[i % TEAM_MEMBERS.length],
      },
    });
    contactIds.push(contact.id);

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

      const lastTouch = await prisma.touch.findFirst({
        where: { contactId: contact.id },
        orderBy: { createdAt: "desc" },
      });
      const interestedTouch = await prisma.touch.findFirst({
        where: { contactId: contact.id, outcome: { in: ["CONNECTED", "REPLIED"] } },
        orderBy: { createdAt: "desc" },
      });
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          lastContactDate: lastTouch?.createdAt ?? null,
          lastInterestedReply: interestedTouch?.createdAt ?? null,
        },
      });
    }
  }

  console.log("Seeding a sample deal and task...");
  const connectedContact = await prisma.contact.findUnique({
    where: { email: "wes.okafor@guardianfireprotect.com" },
  });
  if (connectedContact) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: connectedContact.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: {
          contactId: connectedContact.id,
          title: "Guardian Fire Protection — annual maintenance contract",
          value: 42000,
          stage: DealStage.QUALIFIED,
        },
      });
    }
    const existingTask = await prisma.task.findFirst({ where: { contactId: connectedContact.id } });
    if (!existingTask) {
      await prisma.task.create({
        data: {
          contactId: connectedContact.id,
          title: "Send proposal follow-up",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assignedTo: TeamMember.SAAD_AHMED,
        },
      });
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

  console.log(`Done. Seeded ${SAMPLE_LEADS.length} contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
