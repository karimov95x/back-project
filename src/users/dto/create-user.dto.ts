import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../auth/enums/role.enum";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "clinic@radiomed.kz" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Radiomed Clinic" })
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.CLINIC })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ example: "StrongPass123" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  passwordHash?: string;
}
