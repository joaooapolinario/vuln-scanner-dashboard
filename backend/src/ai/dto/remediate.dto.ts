import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RemediateDto {
    @ApiProperty({
        example: 'WEB',
        description: 'A ferramenta que gerou o alerta (ex: WEB ou NETWORK)'
    })
    @IsString()
    @IsNotEmpty()
    tool: string;

    @ApiProperty({
        example: 'The X-XSS-Protection header is not defined.',
        description: 'A mensagem de vulnerabilidade encontrada'
    })
    @IsString()
    @IsNotEmpty()
    finding: string;
}