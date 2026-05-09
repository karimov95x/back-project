import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { Authorized } from "./decorators/authorized.decorator";
import { Authorization } from "./decorators/authorization.decorator";
import { Public } from "./decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Регистрация нового пользователя" })
  @ApiResponse({ status: 201, description: "Пользователь зарегистрирован" })
  @ApiResponse({ status: 400, description: "Некорректные входные данные" })
  @ApiResponse({ status: 409, description: "Email уже используется" })
  register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(res, dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Вход по email и паролю" })
  @ApiResponse({ status: 200, description: "Вход выполнен" })
  @ApiResponse({ status: 401, description: "Неверный email или пароль" })
  login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    return this.authService.login(res, dto);
  }

  @Authorization()
  @ApiBearerAuth("bearer")
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Выход из системы" })
  @ApiResponse({ status: 200, description: "Сессия завершена" })
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Authorization()
  @ApiBearerAuth("bearer")
  @Get("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Получить профиль текущего пользователя" })
  @ApiResponse({ status: 200, description: "Профиль пользователя" })
  @ApiResponse({ status: 401, description: "Пользователь не авторизован" })
  me(@Authorized("id") userId: string) {
    return this.authService.me(userId);
  }
}
