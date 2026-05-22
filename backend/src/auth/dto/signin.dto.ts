import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email válido' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha com no mínimo 6 caracteres' })
  @IsString()
  @MinLength(6)
  password: string;
}