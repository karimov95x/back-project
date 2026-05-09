import "dotenv/config";
import { PrismaClient, Role, StudyStatus, StudyFileType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await hash("Admin12345", 10);
  const clinicPasswordHash = await hash("Clinic12345", 10);
  const doctorPasswordHash = await hash("Doctor12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@radiomed.local" },
    update: {
      fullName: "Radiomed Admin",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: "admin@radiomed.local",
      fullName: "Radiomed Admin",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  const clinic = await prisma.user.upsert({
    where: { email: "clinic@radiomed.local" },
    update: {
      fullName: "City MRI Clinic",
      role: Role.CLINIC,
      passwordHash: clinicPasswordHash,
    },
    create: {
      email: "clinic@radiomed.local",
      fullName: "City MRI Clinic",
      role: Role.CLINIC,
      passwordHash: clinicPasswordHash,
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@radiomed.local" },
    update: {
      fullName: "Dr. Elena Smirnova",
      role: Role.DOCTOR,
      passwordHash: doctorPasswordHash,
    },
    create: {
      email: "doctor@radiomed.local",
      fullName: "Dr. Elena Smirnova",
      role: Role.DOCTOR,
      passwordHash: doctorPasswordHash,
    },
  });

  const study = await prisma.study.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {
      patientFullName: "Иван Петров",
      patientBirthDate: new Date("1982-06-17"),
      anamnesis:
        "Пациент жалуется на боли в пояснице, требуется МРТ поясничного отдела.",
      status: StudyStatus.IN_PROGRESS,
      isUrgent: true,
      clinicId: clinic.id,
      assignedDoctorId: doctor.id,
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      patientFullName: "Иван Петров",
      patientBirthDate: new Date("1982-06-17"),
      anamnesis:
        "Пациент жалуется на боли в пояснице, требуется МРТ поясничного отдела.",
      status: StudyStatus.IN_PROGRESS,
      isUrgent: true,
      clinicId: clinic.id,
      assignedDoctorId: doctor.id,
      files: {
        create: [
          {
            fileUrl: "https://storage.example.com/studies/demo-study-1.dcm",
            fileType: StudyFileType.DICOM,
          },
          {
            fileUrl: "https://storage.example.com/studies/demo-study-note.txt",
            fileType: StudyFileType.ATTACHMENT,
          },
        ],
      },
      viewers: {
        create: [{ doctorId: doctor.id }],
      },
    },
  });

  await prisma.study.update({
    where: { id: study.id },
    data: {
      viewers: {
        upsert: {
          where: {
            studyId_doctorId: {
              studyId: study.id,
              doctorId: doctor.id,
            },
          },
          create: { doctorId: doctor.id },
          update: { viewedAt: new Date() },
        },
      },
    },
  });

  void admin;
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
