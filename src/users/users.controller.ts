import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Authorized } from "../auth/decorators/authorized.decorator";
import { Authorization } from "../auth/decorators/authorization.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/enums/role.enum";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Authorization()
@ApiBearerAuth("bearer")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: "Создать пользователя администратором" })
  @ApiResponse({ status: 201, description: "Пользователь создан" })
  @ApiResponse({ status: 403, description: "Доступ запрещён" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: "Получить список пользователей" })
  @ApiResponse({ status: 200, description: "Список пользователей" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Получить пользователя по ID" })
  @ApiParam({ name: "id", description: "UUID пользователя" })
  @ApiResponse({ status: 200, description: "Данные пользователя" })
  @ApiResponse({ status: 404, description: "Пользователь не найден" })
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Обновить пользователя" })
  @ApiParam({ name: "id", description: "UUID пользователя" })
  @ApiResponse({ status: 200, description: "Пользователь обновлён" })
  @ApiResponse({ status: 403, description: "Недостаточно прав" })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @Authorized("id") currentUserId: string,
    @Authorized("role") currentRole: Role,
  ) {
    return this.usersService.update(id, dto, currentUserId, currentRole);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  @ApiOperation({ summary: "Удалить пользователя" })
  @ApiParam({ name: "id", description: "UUID пользователя" })
  @ApiResponse({ status: 200, description: "Пользователь удалён" })
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }
}
