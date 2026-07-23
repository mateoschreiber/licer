import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PasswordResetMailerService {
  private readonly logger = new Logger(PasswordResetMailerService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return this.config.get<string>('PASSWORD_RESET_ENABLED') === 'true';
  }

  async send(to: string, token: string) {
    if (!this.isEnabled()) return false;

    const resetUrl = new URL(this.config.getOrThrow<string>('PASSWORD_RESET_BASE_URL'));
    resetUrl.searchParams.set('token', token);
    const port = Number(this.config.getOrThrow<string>('SMTP_PORT'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const transport = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: user && pass ? { user, pass } : undefined,
    });

    await transport.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to,
      subject: 'Restablecimiento de contraseña',
      text: `Use este enlace una sola vez para restablecer su contraseña: ${resetUrl.toString()}`,
    });
    this.logger.log(`Solicitud de restablecimiento entregada a ${to}`);
    return true;
  }
}
