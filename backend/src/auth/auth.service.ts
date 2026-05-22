import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn({email, pass}: {email: string, pass: string}) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async register({email, pass, name}: {email: string, pass: string, name: string}) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('E-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }
}