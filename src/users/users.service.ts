import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../auth/enums/role.enum";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    if (!dto.passwordHash && !dto.password) {
      throw new BadRequestException("Необходимо передать пароль пользователя");
    }

    const passwordHash =
      dto.passwordHash ?? (await hash(dto.password as string, 10));

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        role: dto.role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
    currentRole: Role,
  ) {
    if (currentRole !== Role.ADMIN && currentUserId !== id) {
      throw new ForbiddenException(
        "Недостаточно прав для изменения пользователя",
      );
    }

    await this.findOne(id);

    const updateData: Record<string, unknown> = {
      ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
      ...(dto.fullName ? { fullName: dto.fullName } : {}),
      ...(dto.role && currentRole === Role.ADMIN ? { role: dto.role } : {}),
    };

    if (dto.password) {
      updateData.passwordHash = await hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }
}
