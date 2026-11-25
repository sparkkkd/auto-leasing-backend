import {
  Controller,
  Post,
  Body,
  // UseGuards,
  Get,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedRequest, CookieRequest } from 'src/common/types';
import { CurrentUser, Public } from './decorators';

// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'];

    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  async refreshTokens(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const userId = this.authService.decodeRefreshToken(refreshToken);

      const result = await this.authService.refreshTokens(userId, refreshToken);

      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return {
        user: result.user,
        accessToken: result.accessToken,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Refresh error:', message);
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'];

    if (refreshToken) {
      await this.authService.logout(userId, refreshToken, ipAddress, userAgent);
    }

    response.clearCookie('refreshToken');

    return { message: 'Выход выполнен успешно' };
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  private getIpAddress(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return request.ip;
  }
}
