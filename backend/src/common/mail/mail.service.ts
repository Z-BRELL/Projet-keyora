import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Keyora — Vérifiez votre adresse email',
      html: this.emailTemplate({
        title: 'Bienvenue sur Keyora',
        body: `Bonjour ${name},<br><br>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour activer votre compte.`,
        cta: 'Vérifier mon email',
        url,
      }),
    });
  }

  async sendAlertEmail(
    email: string,
    name: string,
    zoneName: string,
    listing: { title: string; price: number; city: string; id: string },
  ) {
    const url = `${process.env.FRONTEND_URL}/listing/${listing.id}`;
    await this.send({
      to: email,
      subject: `Keyora — Nouveau bien dans votre zone : ${zoneName}`,
      html: this.emailTemplate({
        title: 'Alerte Keyora',
        body: `Bonjour ${name},<br><br>Un nouveau bien correspond à votre zone d'alerte <strong>${zoneName}</strong> :<br><br>
          <b>${listing.title}</b><br>
          📍 ${listing.city}<br>
          💰 ${listing.price.toLocaleString('fr-FR')} FCFA`,
        cta: 'Voir l\'annonce',
        url,
      }),
    });
  }

  async sendModerationEmail(
    email: string,
    name: string,
    listingTitle: string,
    action: 'approved' | 'rejected',
    reason?: string,
  ) {
    const approved = action === 'approved';
    await this.send({
      to: email,
      subject: `Keyora — Votre annonce a été ${approved ? 'approuvée' : 'rejetée'}`,
      html: this.emailTemplate({
        title: `Annonce ${approved ? 'approuvée ✅' : 'rejetée ❌'}`,
        body: `Bonjour ${name},<br><br>Votre annonce <strong>${listingTitle}</strong> a été ${approved ? 'approuvée et publiée' : 'rejetée'}.${reason ? `<br><br>Motif : ${reason}` : ''}`,
        cta: 'Voir mon tableau de bord',
        url: `${process.env.FRONTEND_URL}/dashboard/listings`,
      }),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: `"Keyora" <${process.env.SMTP_FROM || 'noreply@keyora.com'}>`,
        ...options,
      });
    } catch (err) {
      this.logger.error(`Échec envoi email vers ${options.to} : ${err.message}`);
    }
  }

  private emailTemplate(opts: {
    title: string;
    body: string;
    cta: string;
    url: string;
  }) {
    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:40px;">
        <h1 style="color:#1a1a2e;font-size:24px;margin-bottom:16px;">${opts.title}</h1>
        <p style="color:#555;line-height:1.7;">${opts.body}</p>
        <a href="${opts.url}"
           style="display:inline-block;margin-top:24px;background:#6c5ce7;color:#fff;
                  padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          ${opts.cta}
        </a>
        <p style="margin-top:40px;color:#aaa;font-size:12px;">
          Vous recevez cet email car vous êtes inscrit sur Keyora.<br>
          © ${new Date().getFullYear()} Keyora
        </p>
      </div>
    </body>
    </html>`;
  }
}
