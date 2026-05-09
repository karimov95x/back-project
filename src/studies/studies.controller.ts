import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Authorized } from "../auth/decorators/authorized.decorator";
import { Authorization } from "../auth/decorators/authorization.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/enums/role.enum";
import { CompleteStudyDto } from "./dto/complete-study.dto";
import { CreateStudyDto } from "./dto/create-study.dto";
import { QueryStudiesDto } from "./dto/query-studies.dto";
import { RejectStudyDto } from "./dto/reject-study.dto";
import { TakeStudyDto } from "./dto/take-study.dto";
import { UpdateStudyDto } from "./dto/update-study.dto";
import { StudiesService } from "./studies.service";

@ApiTags("Studies")
@Authorization()
@ApiBearerAuth("bearer")
@Controller("studies")
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Roles(Role.CLINIC, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: "Создать новое исследование" })
  @ApiBody({ type: CreateStudyDto })
  @ApiResponse({ status: 201, description: "Исследование создано" })
  @ApiResponse({ status: 400, description: "Некорректные входные данные" })
  create(@Body() dto: CreateStudyDto, @Authorized("id") currentUserId: string) {
    return this.studiesService.create(dto, currentUserId);
  }

  @Get()
  @ApiOperation({ summary: "Получить список исследований с пагинацией" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "search", required: false, example: "Иванов" })
  @ApiQuery({ name: "status", required: false, example: "NEW" })
  @ApiQuery({ name: "isUrgent", required: false, example: "true" })
  @ApiResponse({ status: 200, description: "Список исследований" })
  findAll(
    @Query() query: QueryStudiesDto,
    @Authorized("id") currentUserId: string,
    @Authorized("role") currentRole: Role,
  ) {
    return this.studiesService.findAll(query, currentUserId, currentRole);
  }

  @Get(":id")
  @ApiOperation({ summary: "Получить исследование по ID" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiResponse({ status: 200, description: "Данные исследования" })
  @ApiResponse({ status: 404, description: "Исследование не найдено" })
  findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Authorized("id") currentUserId: string,
    @Authorized("role") currentRole: Role,
  ) {
    return this.studiesService.findOne(id, currentUserId, currentRole);
  }

  @Roles(Role.CLINIC, Role.ADMIN)
  @Patch(":id")
  @ApiOperation({ summary: "Обновить исследование" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiBody({ type: UpdateStudyDto })
  @ApiResponse({ status: 200, description: "Исследование обновлено" })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStudyDto,
    @Authorized("id") currentUserId: string,
    @Authorized("role") currentRole: Role,
  ) {
    return this.studiesService.update(id, dto, currentUserId, currentRole);
  }

  @Roles(Role.CLINIC, Role.ADMIN)
  @Delete(":id")
  @ApiOperation({ summary: "Удалить исследование" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiResponse({ status: 200, description: "Исследование удалено" })
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Authorized("id") currentUserId: string,
    @Authorized("role") currentRole: Role,
  ) {
    return this.studiesService.remove(id, currentUserId, currentRole);
  }

  @Roles(Role.DOCTOR)
  @Patch(":id/take")
  @ApiOperation({ summary: "Взять исследование в работу" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiBody({ type: TakeStudyDto })
  @ApiResponse({ status: 200, description: "Статус изменён на IN_PROGRESS" })
  take(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() _dto: TakeStudyDto,
    @Authorized("id") doctorId: string,
  ) {
    return this.studiesService.takeInWork(id, doctorId);
  }

  @Roles(Role.DOCTOR)
  @Patch(":id/reject")
  @ApiOperation({ summary: "Отказаться от исследования с указанием причины" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiBody({ type: RejectStudyDto })
  @ApiResponse({ status: 200, description: "Статус изменён на REJECTED" })
  reject(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: RejectStudyDto,
    @Authorized("id") doctorId: string,
  ) {
    return this.studiesService.reject(id, dto, doctorId);
  }

  @Roles(Role.DOCTOR)
  @Patch(":id/release")
  @ApiOperation({ summary: "Снять исследование с врача и вернуть в очередь" })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiResponse({ status: 200, description: "Статус изменён на NEW" })
  release(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Authorized("id") doctorId: string,
  ) {
    return this.studiesService.release(id, doctorId);
  }

  @Roles(Role.DOCTOR)
  @Patch(":id/complete")
  @ApiOperation({
    summary: "Загрузить PDF-заключение и завершить исследование",
  })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiBody({ type: CompleteStudyDto })
  @ApiResponse({ status: 200, description: "Статус изменён на COMPLETED" })
  complete(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CompleteStudyDto,
    @Authorized("id") doctorId: string,
  ) {
    return this.studiesService.complete(id, dto, doctorId);
  }

  @Roles(Role.DOCTOR)
  @Patch(":id/reopen")
  @ApiOperation({
    summary: "Удалить заключение и вернуть исследование в работу",
  })
  @ApiParam({ name: "id", description: "UUID исследования" })
  @ApiResponse({ status: 200, description: "Статус изменён на IN_PROGRESS" })
  reopen(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Authorized("id") doctorId: string,
  ) {
    return this.studiesService.reopen(id, doctorId);
  }
}
