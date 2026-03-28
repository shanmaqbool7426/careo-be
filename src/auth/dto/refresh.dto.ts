import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Opaque refresh token from login/register/refresh response',
    minLength: 32,
  })
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}
