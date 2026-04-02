import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, Matches } from 'class-validator';

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
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.:\/-]*$/, { message: 'Alvo inválido. Não pode iniciar com caracteres especiais ou flags.' })
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