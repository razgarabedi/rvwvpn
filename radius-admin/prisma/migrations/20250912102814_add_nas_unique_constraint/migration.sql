/*
  Warnings:

  - A unique constraint covering the columns `[nasname]` on the table `nas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "nas_nasname_key" ON "public"."nas"("nasname");
