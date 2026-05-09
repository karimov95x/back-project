import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role, StudyFileType, StudyStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateStudyDto } from "./dto/create-study.dto";
import type { QueryStudiesDto } from "./dto/query-studies.dto";
import type { RejectStudyDto } from "./dto/reject-study.dto";
import type { CompleteStudyDto } from "./dto/complete-study.dto";
import type { UpdateStudyDto } from "./dto/update-study.dto";

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudyDto, clinicId: string) {
    return this.prisma.study.create({
      data: {
        patientFullName: dto.patientFullName,
        patientBirthDate: new Date(dto.patientBirthDate),
        anamnesis: dto.anamnesis,
        isUrgent: dto.isUrgent,
        status: StudyStatus.NEW,
        clinicId,
        assignedDoctorId: dto.assignedDoctorId,
        files: {
          create: [
            ...dto.dicomFiles.map((fileUrl) => ({
              fileUrl,
              fileType: StudyFileType.DICOM,
            })),
            ...(dto.attachmentFiles ?? []).map((fileUrl) => ({
              fileUrl,
              fileType: StudyFileType.ATTACHMENT,
            })),
          ],
        },
      },
      include: this.getStudyInclude(),
    });
  }

  async findAll(
    query: QueryStudiesDto,
    currentUserId: string,
    currentRole: Role,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query, currentUserId, currentRole);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.study.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
        include: this.getStudyInclude(),
      }),
      this.prisma.study.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUserId: string, currentRole: Role) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      include: this.getStudyInclude(),
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    this.assertAccess(study, currentUserId, currentRole);

    return study;
  }

  async update(
    id: string,
    dto: UpdateStudyDto,
    currentUserId: string,
    currentRole: Role,
  ) {
    const study = await this.findOne(id, currentUserId, currentRole);

    if (currentRole === Role.DOCTOR) {
      throw new ForbiddenException(
        "Врач не может редактировать исследование напрямую",
      );
    }

    if (currentRole === Role.CLINIC && study.clinicId !== currentUserId) {
      throw new ForbiddenException(
        "Недостаточно прав для изменения исследования",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        ...(dto.patientFullName
          ? { patientFullName: dto.patientFullName }
          : {}),
        ...(dto.patientBirthDate
          ? { patientBirthDate: new Date(dto.patientBirthDate) }
          : {}),
        ...(dto.anamnesis ? { anamnesis: dto.anamnesis } : {}),
        ...(typeof dto.isUrgent === "boolean"
          ? { isUrgent: dto.isUrgent }
          : {}),
        ...(dto.assignedDoctorId !== undefined
          ? { assignedDoctorId: dto.assignedDoctorId }
          : {}),
      },
      include: this.getStudyInclude(),
    });
  }

  async remove(id: string, currentUserId: string, currentRole: Role) {
    const study = await this.findOne(id, currentUserId, currentRole);

    if (currentRole !== Role.ADMIN && study.clinicId !== currentUserId) {
      throw new ForbiddenException(
        "Удаление доступно только клинике-владельцу или администратору",
      );
    }

    return this.prisma.study.delete({
      where: { id },
      include: this.getStudyInclude(),
    });
  }

  async takeInWork(id: string, doctorId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      select: { id: true, status: true, assignedDoctorId: true },
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    if (study.status !== StudyStatus.NEW) {
      throw new ForbiddenException(
        "Взять в работу можно только новое исследование",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        status: StudyStatus.IN_PROGRESS,
        assignedDoctorId: doctorId,
        rejectionReason: null,
      },
      include: this.getStudyInclude(),
    });
  }

  async reject(id: string, dto: RejectStudyDto, doctorId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      select: { id: true, assignedDoctorId: true, status: true },
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    if (study.assignedDoctorId !== doctorId) {
      throw new ForbiddenException(
        "Отказ возможен только для назначенного врачу исследования",
      );
    }

    if (study.status !== StudyStatus.IN_PROGRESS) {
      throw new ForbiddenException(
        "Отказ возможен только для исследования в работе",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        status: StudyStatus.REJECTED,
        rejectionReason: dto.reason,
      },
      include: this.getStudyInclude(),
    });
  }

  async release(id: string, doctorId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      select: { id: true, assignedDoctorId: true, status: true },
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    if (study.assignedDoctorId !== doctorId) {
      throw new ForbiddenException(
        "Снять исследование может только назначенный врач",
      );
    }

    if (study.status !== StudyStatus.IN_PROGRESS) {
      throw new ForbiddenException(
        "Вернуть в очередь можно только исследование в работе",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        status: StudyStatus.NEW,
        assignedDoctorId: null,
        rejectionReason: null,
      },
      include: this.getStudyInclude(),
    });
  }

  async complete(id: string, dto: CompleteStudyDto, doctorId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      select: { id: true, assignedDoctorId: true, status: true },
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    if (study.assignedDoctorId !== doctorId) {
      throw new ForbiddenException(
        "Загрузить заключение может только назначенный врач",
      );
    }

    if (study.status !== StudyStatus.IN_PROGRESS) {
      throw new ForbiddenException(
        "Завершить можно только исследование в работе",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        status: StudyStatus.COMPLETED,
        reportFileUrl: dto.reportFileUrl,
        rejectionReason: null,
      },
      include: this.getStudyInclude(),
    });
  }

  async reopen(id: string, doctorId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      select: { id: true, assignedDoctorId: true, status: true },
    });

    if (!study) {
      throw new NotFoundException("Исследование не найдено");
    }

    if (study.assignedDoctorId !== doctorId) {
      throw new ForbiddenException(
        "Удалить заключение может только назначенный врач",
      );
    }

    if (study.status !== StudyStatus.COMPLETED) {
      throw new ForbiddenException(
        "Откатить заключение можно только для завершенного исследования",
      );
    }

    return this.prisma.study.update({
      where: { id },
      data: {
        status: StudyStatus.IN_PROGRESS,
        reportFileUrl: null,
      },
      include: this.getStudyInclude(),
    });
  }

  private buildWhere(
    query: QueryStudiesDto,
    currentUserId: string,
    currentRole: Role,
  ): Prisma.StudyWhereInput {
    const roleWhere: Prisma.StudyWhereInput =
      currentRole === Role.ADMIN
        ? {}
        : currentRole === Role.CLINIC
          ? { clinicId: currentUserId }
          : {
              OR: [
                { assignedDoctorId: currentUserId },
                { status: StudyStatus.NEW },
              ],
            };

    const andConditions: Prisma.StudyWhereInput[] = [roleWhere];

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    if (query.isUrgent !== undefined) {
      andConditions.push({ isUrgent: query.isUrgent === "true" });
    }

    if (query.search) {
      andConditions.push({
        OR: [
          {
            patientFullName: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            anamnesis: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    return {
      AND: andConditions,
    };
  }

  private assertAccess(
    study: {
      clinicId: string;
      assignedDoctorId: string | null;
      status: StudyStatus;
    },
    currentUserId: string,
    currentRole: Role,
  ) {
    if (currentRole === Role.ADMIN) {
      return;
    }

    if (currentRole === Role.CLINIC && study.clinicId !== currentUserId) {
      throw new ForbiddenException(
        "Клиника не имеет доступа к этому исследованию",
      );
    }

    if (
      currentRole === Role.DOCTOR &&
      study.assignedDoctorId !== currentUserId &&
      study.status !== StudyStatus.NEW
    ) {
      throw new ForbiddenException(
        "Врач не имеет доступа к этому исследованию",
      );
    }
  }

  private getStudyInclude() {
    return {
      clinic: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      assignedDoctor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      files: true,
      viewers: {
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    } satisfies Prisma.StudyInclude;
  }
}
