import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jean@exemple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MotDePasse123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: Role,
    default: Role.BUYER,
    description: 'Rôle choisi à l\'inscription',
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.BUYER;

  @ApiProperty({ example: '+237600000000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean@exemple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class VerifyByEmailDto {
  @ApiProperty({ example: 'jean@exemple.com' })
  @IsEmail()
  email: string;
}
