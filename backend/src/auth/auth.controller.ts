import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequestWithUser } from '../common/auth/request-with-user.interface';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordConfirmDto, ResetPasswordRequestDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AllowBeforePasswordChange } from '../common/decorators/allow-before-password-change.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto, request.ip);
    this.authService.setRefreshCookie(response, session.refreshToken);
    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Permissions('auth:logout:own')
  @AllowBeforePasswordChange()
  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response, user);
  }

  @Permissions('auth:logout:own')
  @AllowBeforePasswordChange()
  @Post('change-password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.changePassword(user, dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() request: RequestWithUser & { cookies?: Record<string, string> }) {
    return this.authService.refresh(request.cookies?.refresh_token);
  }

  @Public()
  @Post('reset-password/request')
  requestPasswordReset(@Body() dto: ResetPasswordRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('reset-password/confirm')
  confirmPasswordReset(@Body() _dto: ResetPasswordConfirmDto) {
    return this.authService.confirmPasswordReset();
  }
}
