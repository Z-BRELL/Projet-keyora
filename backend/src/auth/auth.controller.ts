import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyByEmailDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

// ─── Config des cookies JWT ───────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,        // Non accessible en JS (protection XSS)
  sameSite: 'lax' as const, // Protection CSRF (lax = OK pour navigation normale)
  secure: process.env.NODE_ENV === 'production', // HTTPS seulement en prod
  path: '/',
};

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte avec choix du profil' })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion — tokens envoyés en cookies HttpOnly' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() || req.ip;

    const result = await this.authService.login(dto, {
      ip,
      device: req.headers['user-agent'],
    });

    // ─── Pose les tokens en cookies HttpOnly ─────────────────────────────────
    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/api/auth', // Le refresh token n'est envoyé qu'aux routes /api/auth
    });

    // Retourne les tokens AUSSI dans le body pour la compatibilité
    // (Swagger, apps mobiles, etc.) — le frontend web utilisera les cookies
    return result;
  }

  @Get('verify-email')
  @ApiOperation({ summary: "Vérifier l'adresse email via le lien reçu" })
  @ApiResponse({ status: 200, description: 'Email vérifié et connexion automatique' })
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(token);

    if (result.accessToken && result.refreshToken) {
      res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });
    }

    return result;
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renvoyer l'e-mail de confirmation" })
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  // ⚠️ TEMPORAIRE / PHASE DE TEST : pas d'authentification, voir auth.service.ts#verifyByEmail
  @Patch('verify-by-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[TEST] Vérifier un compte via son email, sans authentification" })
  verifyByEmail(@Body() dto: VerifyByEmailDto) {
    return this.authService.verifyByEmail(dto.email);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renouveler l'access token via le refresh token" })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Lit le refresh token depuis le cookie en priorité, sinon depuis le body
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? dto?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      const tokens = await this.authService.refreshTokens(payload.sub, token);

      // Renouvelle les cookies
      res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token malformé ou invalide');
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion et suppression des cookies JWT' })
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);

    // ─── Supprime les cookies ─────────────────────────────────────────────────
    res.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...COOKIE_OPTIONS, path: '/api/auth' });

    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtenir le profil de l'utilisateur connecté" })
  me(@CurrentUser() user: any) {
    return user;
  }
}
