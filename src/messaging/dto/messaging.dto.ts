import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ description: 'The other user to start conversation with' })
  @IsUUID()
  recipientId!: string;

  @ApiPropertyOptional({ description: 'Listing the conversation is about' })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional({ example: 'Hi, is this still available?' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  initialMessage?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Yes, it is! When can you come for a test drive?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
