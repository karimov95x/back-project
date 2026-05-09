import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class TakeStudyDto {
  @ApiPropertyOptional({ example: "Возьму в работу сегодня." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
