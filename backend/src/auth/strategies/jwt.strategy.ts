import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/** Extrait le JWT depuis :
 *  1. Le cookie HttpOnly `accessToken` (prioritaire, sécurisé XSS)
 *  2. Le header Authorization: Bearer <token> (fallback, compatibilité)
 */
function extractJwtFromCookieOrHeader(req: Request): string | null {
  // Priorité 1 : Bearer header (Swagger, apps mobiles, etc.)
  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Priorité 2 : cookie HttpOnly
  if (req?.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }
  // Priorité 3 : paramètre de requête (SSE / EventSource)
  const tokenQuery = req?.query?.token;
  if (typeof tokenQuery === 'string') {
    return tokenQuery;
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
      // Nécessaire pour accéder à req dans la fonction d'extraction
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
      },
    });
    if (!user) throw new UnauthorizedException('Token invalide');
    return user;
  }
}
