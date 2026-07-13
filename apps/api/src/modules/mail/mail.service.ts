import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { EnvConfig } from '../../config/env.validation';
import { EMAIL_LOGO_CID, loadEmailLogoBase64 } from './email-assets';
import { buildMembershipApplicationAcceptedEmail } from './templates/membership-application-accepted.email';
import { buildMembershipApplicationReceivedEmail } from './templates/membership-application-received.email';
import { buildPasswordResetOtpEmail } from './templates/password-reset-otp.email';
import { buildUserCredentialsEmail } from './templates/user-credentials.email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string | null;
  private readonly logoBase64: string | null;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    const fromEmail = this.config.get('RESEND_FROM_EMAIL', { infer: true });
    const fromName = this.config.get('SMTP_FROM_NAME', { infer: true });

    this.logoBase64 = loadEmailLogoBase64();
    if (!this.logoBase64) {
      this.logger.warn('Logo e-mail introuvable — les e-mails seront envoyés sans logo intégré.');
    }

    if (apiKey && fromEmail && fromName) {
      this.resend = new Resend(apiKey);
      this.fromAddress = `${fromName} <${fromEmail}>`;
    } else {
      this.resend = null;
      this.fromAddress = null;
      this.logger.warn(
        'Configuration Resend incomplète — les e-mails transactionnels seront ignorés.',
      );
    }
  }

  async sendMembershipApplicationConfirmation(input: {
    to: string;
    firstName: string;
    lastName: string;
  }) {
    if (!this.resend || !this.fromAddress) {
      this.logger.warn(
        `E-mail de confirmation d'adhésion non envoyé à ${input.to} (Resend non configuré).`,
      );
      return;
    }

    const includeLogo = Boolean(this.logoBase64);
    const { subject, html, text } = buildMembershipApplicationReceivedEmail({
      ...input,
      includeLogo,
    });

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject,
      html,
      text,
      attachments: includeLogo
        ? [
            {
              filename: 'logo.png',
              content: this.logoBase64!,
              contentId: EMAIL_LOGO_CID,
            },
          ]
        : undefined,
    });

    if (error) {
      this.logger.error(
        `Échec d'envoi de l'e-mail de confirmation d'adhésion à ${input.to}: ${error.message}`,
      );
      return;
    }

    this.logger.log(`E-mail de confirmation d'adhésion envoyé à ${input.to}`);
  }

  async sendMembershipApplicationAccepted(input: {
    to: string;
    firstName: string;
    lastName: string;
  }) {
    if (!this.resend || !this.fromAddress) {
      this.logger.warn(
        `E-mail d'acceptation d'adhésion non envoyé à ${input.to} (Resend non configuré).`,
      );
      return;
    }

    const includeLogo = Boolean(this.logoBase64);
    const { subject, html, text } = buildMembershipApplicationAcceptedEmail({
      ...input,
      includeLogo,
    });

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject,
      html,
      text,
      attachments: includeLogo
        ? [
            {
              filename: 'logo.png',
              content: this.logoBase64!,
              contentId: EMAIL_LOGO_CID,
            },
          ]
        : undefined,
    });

    if (error) {
      this.logger.error(
        `Échec d'envoi de l'e-mail d'acceptation d'adhésion à ${input.to}: ${error.message}`,
      );
      return;
    }

    this.logger.log(`E-mail d'acceptation d'adhésion envoyé à ${input.to}`);
  }

  async sendPasswordResetOtp(input: {
    to: string;
    firstName: string;
    lastName: string;
    code: string;
    expiresInMinutes: number;
  }) {
    if (!this.resend || !this.fromAddress) {
      this.logger.warn(
        `E-mail OTP de réinitialisation non envoyé à ${input.to} (Resend non configuré).`,
      );
      return;
    }

    const includeLogo = Boolean(this.logoBase64);
    const { subject, html, text } = buildPasswordResetOtpEmail({
      firstName: input.firstName,
      lastName: input.lastName,
      code: input.code,
      expiresInMinutes: input.expiresInMinutes,
      includeLogo,
    });

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject,
      html,
      text,
      attachments: includeLogo
        ? [
            {
              filename: 'logo.png',
              content: this.logoBase64!,
              contentId: EMAIL_LOGO_CID,
            },
          ]
        : undefined,
    });

    if (error) {
      this.logger.error(
        `Échec d'envoi de l'e-mail OTP de réinitialisation à ${input.to}: ${error.message}`,
      );
      return;
    }

    this.logger.log(`E-mail OTP de réinitialisation envoyé à ${input.to}`);
  }

  async sendUserCredentials(input: {
    to: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    if (!this.resend || !this.fromAddress) {
      this.logger.warn(
        `E-mail d'identifiants non envoyé à ${input.to} (Resend non configuré).`,
      );
      return;
    }

    const loginUrl = `${this.config.get('CORS_ORIGIN', { infer: true }).replace(/\/$/, '')}/connexion`;
    const includeLogo = Boolean(this.logoBase64);
    const { subject, html, text } = buildUserCredentialsEmail({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      loginUrl,
      includeLogo,
    });

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject,
      html,
      text,
      attachments: includeLogo
        ? [
            {
              filename: 'logo.png',
              content: this.logoBase64!,
              contentId: EMAIL_LOGO_CID,
            },
          ]
        : undefined,
    });

    if (error) {
      this.logger.error(
        `Échec d'envoi de l'e-mail d'identifiants à ${input.to}: ${error.message}`,
      );
      return;
    }

    this.logger.log(`E-mail d'identifiants envoyé à ${input.to}`);
  }
}
