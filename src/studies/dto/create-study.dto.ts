import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

export class CreateStudyDto {
  @ApiProperty({ example: "Иван Петров" })
  @IsString()
  @IsNotEmpty()
  patientFullName!: string;

  @ApiProperty({ example: "1985-04-12" })
  @IsDateString()
  patientBirthDate!: string;

  @ApiProperty({ example: "Жалобы на головную боль, подозрение на инсульт." })
  @IsString()
  @MinLength(10)
  anamnesis!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isUrgent!: boolean;

  @ApiProperty({
    example: ["https://storage.example.com/studies/1/file1.dcm"],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  dicomFiles!: string[];

  @ApiPropertyOptional({
    example: ["https://storage.example.com/studies/1/archive.zip"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentFiles?: string[];

  @ApiPropertyOptional({ example: "b60bda40-d4bd-4783-a3c3-2ed8b4f2a0aa" })
  @IsOptional()
  @IsUUID()
  assignedDoctorId?: string;
}
