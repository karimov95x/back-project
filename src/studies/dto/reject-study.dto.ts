import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectStudyDto {
  @ApiProperty({
    example: "Недостаточно данных для интерпретации исследования.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
