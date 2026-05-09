import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../enums/role.enum";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "doctor@radiomed.kz" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass123" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "Алексей Соколов" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  @IsEnum(Role)
  role!: Role;
}
