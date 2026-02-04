import { ApiProperty } from '@nestjs/swagger';

export enum ScanTypeDto {
  NETWORK = 'NETWORK',
  WEB = 'WEB',
}

export class CreateScanDto {
  @ApiProperty({ 
    example: 'scanme.nmap.org', 
    description: 'Alvo da varredura (Domínio ou IP)' 
  })
  target: string;

  @ApiProperty({ 
    enum: ScanTypeDto, 
    example: 'NETWORK', 
    description: 'Tipo de varredura: NETWORK (Nmap) ou WEB (Nikto)',
    required: false,
    default: 'NETWORK'
  })
  type?: 'NETWORK' | 'WEB';
}