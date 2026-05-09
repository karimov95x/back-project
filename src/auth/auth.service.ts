import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import type { CookieOptions, Response } from "express";
import type { SignOptions } from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { isDev } from "../utils/is-dev.util";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import { Role } from "./enums/role.enum";
import type { JwtPayload } from "./interfaces/jwt.interface";

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminAccount();
  }

  async register(res: Response, dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      passwordHash,
      role: dto.role,
    });

    return this.issueSession(res, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(res: Response, dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const isValidPassword = await compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    return this.issueSession(res, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  logout(res: Response) {
    res.clearCookie("accessToken", this.getCookieOptions());

    return { message: "Выход выполнен успешно" };
  }

  async me(userId: string) {
    return this.usersService.findOne(userId);
  }

  validateUser(payload: JwtPayload): JwtPayload {
    if (!payload?.id || !payload?.email || !payload?.role) {
      throw new UnauthorizedException("Пользователь не авторизован");
    }

    return payload;
  }

  private issueSession(res: Response, payload: JwtPayload) {
    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      expiresIn: (this.configService.get<string>("JWT_EXPIRES_IN") ??
        "7d") as SignOptions["expiresIn"],
    });

    res.cookie("accessToken", token, {
      ...this.getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: token,
      user: payload,
    };
  }

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: !isDev(),
      sameSite: !isDev() ? "none" : "lax",
      path: "/",
    };
  }

  private async ensureAdminAccount() {
    const adminEmail = this.configService.get<string>("ADMIN_EMAIL")?.trim();
    const adminPassword = this.configService
      .get<string>("ADMIN_PASSWORD")
      ?.trim();
    const adminName =
      this.configService.get<string>("ADMIN_NAME")?.trim() ?? "Radiomed Admin";

    if (!adminEmail || !adminPassword) {
      return;
    }

    const normalizedEmail = adminEmail.toLowerCase();
    const passwordHash = await hash(adminPassword, 10);
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!existingAdmin) {
      await this.usersService.create({
        email: normalizedEmail,
        fullName: adminName,
        passwordHash,
        role: Role.ADMIN,
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        fullName: adminName,
        passwordHash,
        role: Role.ADMIN,
      },
    });
  }
}
