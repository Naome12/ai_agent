/*
  Warnings:

  - Added the required column `category` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `job` ADD COLUMN `category` ENUM('BASIC', 'ADVANCED') NOT NULL;

-- AlterTable
ALTER TABLE `jobseeker` ADD COLUMN `desiredJob` ENUM('full_time', 'part_time', 'contract', 'temporary') NULL,
    ADD COLUMN `expectedSalary` DOUBLE NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;
