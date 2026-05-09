-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'CLINIC');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StudyFileType" AS ENUM ('DICOM', 'ATTACHMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "patientFullName" TEXT NOT NULL,
    "patientBirthDate" TIMESTAMP(3) NOT NULL,
    "anamnesis" TEXT NOT NULL,
    "status" "StudyStatus" NOT NULL DEFAULT 'NEW',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "clinicId" TEXT NOT NULL,
    "assignedDoctorId" TEXT,
    "rejectionReason" TEXT,
    "reportFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyFile" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "StudyFileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyViewer" (
    "studyId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyViewer_pkey" PRIMARY KEY ("studyId","doctorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Study_status_idx" ON "Study"("status");

-- CreateIndex
CREATE INDEX "Study_clinicId_idx" ON "Study"("clinicId");

-- CreateIndex
CREATE INDEX "Study_assignedDoctorId_idx" ON "Study"("assignedDoctorId");

-- CreateIndex
CREATE INDEX "Study_isUrgent_status_idx" ON "Study"("isUrgent", "status");

-- CreateIndex
CREATE INDEX "StudyFile_studyId_idx" ON "StudyFile"("studyId");

-- CreateIndex
CREATE INDEX "StudyViewer_doctorId_idx" ON "StudyViewer"("doctorId");

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyFile" ADD CONSTRAINT "StudyFile_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyViewer" ADD CONSTRAINT "StudyViewer_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyViewer" ADD CONSTRAINT "StudyViewer_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

