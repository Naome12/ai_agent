import { PrismaClient, ExperienceLevel, JobType } from "@prisma/client";
import { hashPassword } from "../src/utils/passwords";
const prisma = new PrismaClient();

async function main() {
  // Clear previous data
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.employer.deleteMany({});
  await prisma.jobSeeker.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Admin Accounts ---
  const admins = [
    { fname: "Alice", lname: "Admin", email: "alice.admin@kozi.com", password: "Admin123!" },
    { fname: "Bob", lname: "Admin", email: "bob.admin@kozi.com", password: "Admin123!" },
    { fname: "Carol", lname: "Admin", email: "carol.admin@kozi.com", password: "Admin123!" },
  ];

  for (const admin of admins) {
    await prisma.user.create({
      data: {
        fname: admin.fname,
        lname: admin.lname,
        email: admin.email,
        password: await hashPassword(admin.password),
        role: "admin",
      },
    });
  }

  // --- Employers ---
  const employersData = [
    { fname: "John", lname: "Doe", email: "john.doe@kozi.com", companyName: "CleanCo", companySize: 15, industry: "Cleaning" },
    { fname: "Mary", lname: "Smith", email: "mary.smith@kozi.com", companyName: "SecureCorp", companySize: 50, industry: "Security" },
    { fname: "Peter", lname: "Brown", email: "peter.brown@kozi.com", companyName: "ChefHub", companySize: 10, industry: "Culinary" },
    { fname: "Linda", lname: "White", email: "linda.white@kozi.com", companyName: "DesignPro", companySize: 8, industry: "Graphic Design" },
    { fname: "James", lname: "Black", email: "james.black@kozi.com", companyName: "TechSoft", companySize: 25, industry: "Software" },
    { fname: "Emma", lname: "Green", email: "emma.green@kozi.com", companyName: "MarketGenius", companySize: 12, industry: "Marketing" },
    { fname: "Robert", lname: "King", email: "robert.king@kozi.com", companyName: "HouseKeepers", companySize: 20, industry: "Housekeeping" },
    { fname: "Olivia", lname: "Lee", email: "olivia.lee@kozi.com", companyName: "BabyCare", companySize: 15, industry: "Childcare" },
    { fname: "William", lname: "Scott", email: "william.scott@kozi.com", companyName: "PoolCleaners", companySize: 10, industry: "Cleaning" },
    { fname: "Sophia", lname: "Hall", email: "sophia.hall@kozi.com", companyName: "SafeGuard", companySize: 30, industry: "Security" },
  ];

  for (const emp of employersData) {
    const user = await prisma.user.create({
      data: {
        fname: emp.fname,
        lname: emp.lname,
        email: emp.email,
        password: await hashPassword("Employer123!"),
        role: "employer",
      },
    });

    await prisma.employer.create({
      data: {
        userId: user.id,
        companyName: emp.companyName,
        companySize: emp.companySize,
        industry: emp.industry,
      },
    });
  }

  // --- Job Seekers with realistic skills ---
  const jobSeekersData = [
    { fname: "Ethan", lname: "Walker", email: "ethan.walker@kozi.com", skills: "React, Node.js, Python", desiredJob: "Software Developer", experience: "advanced" },
    { fname: "Ava", lname: "Harris", email: "ava.harris@kozi.com", skills: "Photoshop, Illustrator, Figma", desiredJob: "Graphic Designer", experience: "advanced" },
    { fname: "Mia", lname: "Martin", email: "mia.martin@kozi.com", skills: "Excel, Accounting, Tax", desiredJob: "Accountant", experience: "advanced" },
    { fname: "Lucas", lname: "Thompson", email: "lucas.thompson@kozi.com", skills: "Chef skills, Menu Planning", desiredJob: "Professional Chef", experience: "advanced" },
    { fname: "Amelia", lname: "Garcia", email: "amelia.garcia@kozi.com", skills: "SEO, Marketing, Analytics", desiredJob: "Marketing Expert", experience: "advanced" },
    { fname: "Noah", lname: "Martinez", email: "noah.martinez@kozi.com", skills: "Cleaning, Housekeeping", desiredJob: "Housemaid", experience: "beginner" },
    { fname: "Isabella", lname: "Robinson", email: "isabella.robinson@kozi.com", skills: "Security, Monitoring", desiredJob: "Security Guard", experience: "skilled" },
    { fname: "Liam", lname: "Clark", email: "liam.clark@kozi.com", skills: "Pool cleaning, Maintenance", desiredJob: "Pool Cleaner", experience: "skilled" },
    { fname: "Charlotte", lname: "Rodriguez", email: "charlotte.rodriguez@kozi.com", skills: "Childcare, Babysitting", desiredJob: "Babysitter", experience: "skilled" },
    { fname: "Oliver", lname: "Lewis", email: "oliver.lewis@kozi.com", skills: "Housekeeping, Cleaning", desiredJob: "Professional Cleaner", experience: "beginner" },
    { fname: "Harper", lname: "Lee", email: "harper.lee@kozi.com", skills: "React, Vue.js, Node.js", desiredJob: "Software Developer", experience: "advanced" },
    { fname: "Elijah", lname: "Walker", email: "elijah.walker@kozi.com", skills: "Python, Django, Flask", desiredJob: "Software Developer", experience: "advanced" },
    { fname: "Evelyn", lname: "Hall", email: "evelyn.hall@kozi.com", skills: "Illustrator, Photoshop", desiredJob: "Graphic Designer", experience: "advanced" },
    { fname: "James", lname: "Allen", email: "james.allen@kozi.com", skills: "Accounting, Excel, QuickBooks", desiredJob: "Accountant", experience: "advanced" },
    { fname: "Scarlett", lname: "Young", email: "scarlett.young@kozi.com", skills: "Marketing, Social Media", desiredJob: "Marketing Expert", experience: "advanced" },
    { fname: "Henry", lname: "Hernandez", email: "henry.hernandez@kozi.com", skills: "Housekeeping, Cleaning", desiredJob: "Housemaid", experience: "skilled" },
    { fname: "Abigail", lname: "King", email: "abigail.king@kozi.com", skills: "Security, Patrol", desiredJob: "Security Guard", experience: "skilled" },
    { fname: "Alexander", lname: "Wright", email: "alexander.wright@kozi.com", skills: "Pool maintenance, Cleaning", desiredJob: "Pool Cleaner", experience: "skilled" },
    { fname: "Emily", lname: "Lopez", email: "emily.lopez@kozi.com", skills: "Childcare, Babysitting", desiredJob: "Babysitter", experience: "skilled" },
    { fname: "Daniel", lname: "Hill", email: "daniel.hill@kozi.com", skills: "Professional Cleaning", desiredJob: "Professional Cleaner", experience: "beginner" },
  ];

  for (const js of jobSeekersData) {
    const user = await prisma.user.create({
      data: {
        fname: js.fname,
        lname: js.lname,
        email: js.email,
        password: await hashPassword("JobSeeker123!"),
        role: "job_seeker",
      },
    });

    await prisma.jobSeeker.create({
      data: {
        userId: user.id,
        experience: js.experience as ExperienceLevel,
        phone: "078" + Math.floor(Math.random() * 10000000).toString().padStart(7, "0"),
        location: "Kigali",
        desiredJob: "full_time", // can map based on JobType if needed
        expectedSalary: Math.floor(Math.random() * (100000 - 35000 + 1) + 35000),
        skills: js.skills,
      },
    });
  }

  console.log("Seed completed successfully with realistic skills and hashed passwords!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
