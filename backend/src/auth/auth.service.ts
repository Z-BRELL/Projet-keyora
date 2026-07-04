import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { MailService } from '../common/mail/mail.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    // L'inscription publique ne doit jamais permettre de créer un compte à privilèges.
    // On autorise uniquement BUYER ou SELLER, et on retombe sur BUYER par défaut.
    const safeRole = dto.role === Role.SELLER ? Role.SELLER : Role.BUYER;

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verifyToken = uuidv4();

    // DEV MODE: Auto-verify accounts for testing (remove in production)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: safeRole,
        verifyToken,
        isVerified: isDevelopment, // Auto-verify in development for testing
      },
    });

    if (this.mail && this.mail.sendVerificationEmail && !isDevelopment) {
      await this.mail.sendVerificationEmail(user.email, user.fullName, verifyToken);
    }

    return { 
      message: isDevelopment 
        ? 'Inscription réussie. Vous pouvez maintenant vous connecter.' 
        : 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.', 
      userId: user.id 
    };
  }

  async login(dto: LoginDto, meta?: { ip?: string; device?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // DEV MODE: Allow unverified accounts in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!user.isVerified && !isDevelopment) {
      throw new UnauthorizedException('Compte non vérifié. Vérifiez votre email.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    const now = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefresh,
        lastLogin: now,
        loginCount: { increment: 1 },
        loginHistory: {
          create: {
            ip: meta?.ip,
            device: meta?.device,
            timestamp: now,
          },
        },
      },
    });

    return { ...tokens, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) throw new BadRequestException('Token invalide ou expiré');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });
    return { message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Accès refusé');

    // FIX #3: Verify refresh token signature before accepting
    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token invalide ou tamperié');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Déconnexion réussie' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET, expiresIn: '15m' }),
      this.jwt.signAsync(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }),
    ]);
    return { accessToken, refreshToken };
  }
}
