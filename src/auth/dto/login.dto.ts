import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo123!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
