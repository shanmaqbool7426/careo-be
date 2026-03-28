import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'YourStr0ngPass' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @MinLength(1)
  displayName!: string;

  @ApiProperty({ example: 'USER', enum: ['USER', 'DEALER'], required: false })
  @IsString()
  role?: string;
}
