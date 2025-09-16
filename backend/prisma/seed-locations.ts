// import { PrismaClient } from "@prisma/client";
// import fs from "fs";
// import path from "path";

// const prisma = new PrismaClient();

// function loadJson(filename: string) {
//   const filePath = path.join(__dirname, "../resources", filename);
//   const raw = fs.readFileSync(filePath, "utf-8");
//   const parsed = JSON.parse(raw);
//   // Find the "data" array in the structure
//   const table = parsed.find((x: any) => x.type === "table");
//   return table?.data || [];
// }

// async function main() {
//   // Load data
//   const provinces = loadJson("1_provinces.json");
//   const districts = loadJson("2_districts.json");
//   const sectors = loadJson("3_sectors.json");
//   const cells = loadJson("4_cells.json");
//   const villages = loadJson("5_villages.json");

//   // Seed Provinces
//   for (const prv of provinces) {
//     await prisma.province.upsert({
//       where: { id: Number(prv.prv_id) },
//       update: { name: prv.prv_name.trim() },
//       create: { id: Number(prv.prv_id), name: prv.prv_name.trim() },
//     });
//   }

//   // Seed Districts
//   for (const dst of districts) {
//     await prisma.district.upsert({
//       where: { id: Number(dst.dst_id) },
//       update: {
//         name: dst.dst_name.trim(),
//         provinceId: Number(dst.dst_province),
//       },
//       create: {
//         id: Number(dst.dst_id),
//         name: dst.dst_name.trim(),
//         provinceId: Number(dst.dst_province),
//       },
//     });
//   }

//   // Seed Sectors
//   for (const sct of sectors) {
//     await prisma.sector.upsert({
//       where: { id: Number(sct.sct_id) },
//       update: {
//         name: sct.sct_name.trim(),
//         districtId: Number(sct.sct_district),
//       },
//       create: {
//         id: Number(sct.sct_id),
//         name: sct.sct_name.trim(),
//         districtId: Number(sct.sct_district),
//       },
//     });
//   }

//   // Seed Cells
//   for (const cel of cells) {
//     await prisma.cell.upsert({
//       where: { id: Number(cel.cel_id) },
//       update: {
//         name: cel.cel_name.trim(),
//         sectorId: Number(cel.cel_sector),
//       },
//       create: {
//         id: Number(cel.cel_id),
//         name: cel.cel_name.trim(),
//         sectorId: Number(cel.cel_sector),
//       },
//     });
//   }

//   // Seed Villages
//   for (const vlg of villages) {
//     await prisma.village.upsert({
//       where: { id: Number(vlg.vlg_id) },
//       update: {
//         name: vlg.vlg_name.trim(),
//         cellId: Number(vlg.vlg_cell),
//       },
//       create: {
//         id: Number(vlg.vlg_id),
//         name: vlg.vlg_name.trim(),
//         cellId: Number(vlg.vlg_cell),
//       },
//     });
//   }

//   console.log("Location data seeded successfully!");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(() => prisma.$disconnect());
