import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { SigninDto } from './dto/signin.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login de usuário' })
  signIn(@Body() body: SigninDto) {
    return this.authService.signIn({ email: body.email, pass: body.password });
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuário' })
  register(@Body() body: RegisterDto) {
    return this.authService.register({
      email: body.email,
      pass: body.password,
      name: body.name,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obter dados do perfil do usuário autenticado' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }
}