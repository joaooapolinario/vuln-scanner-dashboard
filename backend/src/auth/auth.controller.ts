import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { SigninDto } from './dto/signin.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login de usuário' })
  signIn(@Body() body: SigninDto) {
    return this.authService.signIn({email: body.email, pass: body.password});
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuário' })
  register(@Body() body: RegisterDto) {
    return this.authService.register({email: body.email, pass: body.password, name: body.name});
  }
}  