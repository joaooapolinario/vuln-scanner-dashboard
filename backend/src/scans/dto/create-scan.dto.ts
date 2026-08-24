import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { IsTarget } from '../validators/is-target.validator';

export enum ScanTypeDto {
  NETWORK = 'NETWORK',
  WEB = 'WEB',
}

export class CreateScanDto {
  @ApiProperty({ 
    example: 'scanme.nmap.org', 
    description: 'Alvo da varredura (Domínio ou IP)' 
  })
  @IsString()
  @IsNotEmpty()
  @IsTarget()
  target: string;

  @ApiProperty({ 
    enum: ScanTypeDto, 
    example: 'NETWORK', 
    description: 'Tipo de varredura: NETWORK (Nmap) ou WEB (Nikto)',
    required: false,
    default: 'NETWORK'
  })
  @IsOptional()
  @IsEnum(ScanTypeDto)
  type?: 'NETWORK' | 'WEB';
}