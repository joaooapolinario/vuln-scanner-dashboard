import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException();
    }
    
    try {
      // 1. Verifica se a assinatura do token é válida (usando o segredo do AuthModule)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'SEGREDO_SUPER_SECRETO_DEV', // Em prod, use process.env
      });
      
      // 2. Anexa os dados do usuário (payload) ao objeto Request
      // Assim, podemos acessar request['user'] nos controllers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}