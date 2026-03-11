import { ApiProperty } from '@nestjs/swagger';

export class RemediateDto {
    @ApiProperty({
        example: 'WEB',
        description: 'A ferramenta que gerou o alerta (ex: WEB ou NETWORK)'
    })
    tool: string;

    @ApiProperty({
        example: 'The X-XSS-Protection header is not defined.',
        description: 'A mensagem de vulnerabilidade encontrada'
    })
    finding: string;
}