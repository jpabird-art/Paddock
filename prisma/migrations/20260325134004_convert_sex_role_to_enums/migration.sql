/*
  Warnings:

  - The `role` column on the `horses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sex` column on the `horses` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('GELDING', 'MARE');

-- CreateEnum
CREATE TYPE "HorseRole" AS ENUM ('CHARGER', 'CAV_BLACK', 'GREY', 'STANDARD', 'COMP', 'RMT');

-- AlterTable
ALTER TABLE "horses" DROP COLUMN "role",
ADD COLUMN     "role" "HorseRole",
DROP COLUMN "sex",
ADD COLUMN     "sex" "Sex";
