import { ApiPropertyOptional } from "@nestjs/swagger";
import { StudyStatus } from "@prisma/client";
import { IsBooleanString, IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class QueryStudiesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StudyStatus, example: StudyStatus.NEW })
  @IsOptional()
  @IsEnum(StudyStatus)
  status?: StudyStatus;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  isUrgent?: string;
}
