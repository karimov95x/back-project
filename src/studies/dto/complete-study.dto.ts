import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CompleteStudyDto {
  @ApiProperty({ example: "https://storage.example.com/reports/report-1.pdf" })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  reportFileUrl!: string;
}
