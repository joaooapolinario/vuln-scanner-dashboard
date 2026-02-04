import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ 
    example: 'admin@scanner.com', 
    description: 'Email do usuário' 
  })
  email: string;

  @ApiProperty({ 
    example: '123456', 
    description: 'Senha de acesso (mínimo 6 caracteres)',
    minLength: 6
  })
  password: string;

  @ApiProperty({ 
    example: 'João Silva', 
    description: 'Nome do usuário',
  })
  name: string;
}