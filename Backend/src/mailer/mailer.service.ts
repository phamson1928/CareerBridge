import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  EmailLogStatus,
  EmailLogType,
  InterviewMode,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  replyTo?: string;
  icsContent?: string;
}

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      secure: this.configService.getOrThrow<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  private getFromAddress(): string {
    return this.configService.getOrThrow<string>('SMTP_FROM');
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    );
  }

  private formatViDateTime(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private formatViDate(date: Date | null | undefined): string {
    if (!date) return 'Theo thông báo của doanh nghiệp';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private wrapEmailLayout(params: {
    badge: string;
    badgeColor?: string;
    heading: string;
    bodyHtml: string;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaColor?: string;
    footerNote?: string;
  }): string {
    const accentColor = params.ctaColor || '#047857';
    const badgeBg = params.badgeColor || '#ecfdf5';
    return `
      <div style="background-color: #f8fafc; padding: 32px 16px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.65;">
        <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);">
          <div style="background-color: #065f46; padding: 18px 28px; color: #ffffff;">
            <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.2px;">CareerBridge</div>
            <div style="font-size: 12px; color: #d1fae5; margin-top: 2px;">Hệ thống Quản lý &amp; Kết nối Thực tập Đại học – Doanh nghiệp</div>
          </div>
          <div style="padding: 28px;">
            <div style="display: inline-block; background-color: ${badgeBg}; color: ${accentColor}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 12px;">
              ${this.escapeHtml(params.badge)}
            </div>
            <h2 style="margin: 0 0 18px 0; font-size: 20px; color: #0f172a; line-height: 1.35;">
              ${this.escapeHtml(params.heading)}
            </h2>
            ${params.bodyHtml}
            ${
              params.ctaLabel && params.ctaUrl
                ? `<div style="margin: 26px 0 18px 0;">
                    <a href="${params.ctaUrl}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      ${this.escapeHtml(params.ctaLabel)}
                    </a>
                  </div>`
                : ''
            }
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="margin: 0; font-size: 14px; color: #334155;">
              Trân trọng,<br />
              <strong>Ban Quản lý Thực tập &amp; Đội ngũ CareerBridge</strong>
            </p>
            ${
              params.footerNote
                ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">${this.escapeHtml(params.footerNote)}</p>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  private buildIcs(params: {
    uid: string;
    start: Date;
    durationMinutes?: number;
    summary: string;
    description: string;
    location: string;
    organizerEmail: string;
    organizerName: string;
  }): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toIcsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    const end = new Date(
      params.start.getTime() + (params.durationMinutes ?? 45) * 60 * 1000,
    );
    const clean = (value: string) =>
      value.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CareerBridge//Interview Invitation//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${params.uid}@careerbridge`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(params.start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${clean(params.summary)}`,
      `DESCRIPTION:${clean(params.description)}`,
      `LOCATION:${clean(params.location)}`,
      `ORGANIZER;CN=${clean(params.organizerName)}:mailto:${params.organizerEmail}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  renderInterviewInvitationTemplate(params: {
    applicationId: string;
    studentName: string;
    companyName: string;
    internshipTitle: string;
    scheduledAt: Date;
    mode: InterviewMode;
    meetingLink?: string | null;
    location?: string | null;
    contactName: string;
    contactEmail: string;
    contactPhone?: string | null;
    note?: string | null;
  }): RenderedEmailTemplate {
    const modeLabel =
      params.mode === InterviewMode.ONLINE
        ? 'Phỏng vấn trực tuyến'
        : 'Phỏng vấn trực tiếp tại văn phòng';
    const placeValue =
      params.mode === InterviewMode.ONLINE
        ? params.meetingLink || 'Doanh nghiệp sẽ cập nhật đường dẫn sau'
        : params.location || 'Tại văn phòng doanh nghiệp';

    const subject = `[CareerBridge] Thư mời phỏng vấn thực tập vị trí "${params.internshipTitle}" — ${params.companyName}`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Thân gửi <strong>${this.escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        Chúc mừng bạn! Hồ sơ ứng tuyển của bạn cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong> đã vượt qua vòng đánh giá hồ sơ. Doanh nghiệp trân trọng mời bạn tham dự buổi phỏng vấn với thông tin chi tiết như sau:
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Thời gian hẹn:</strong> ${this.escapeHtml(this.formatViDateTime(params.scheduledAt))}</p>
        <p style="margin: 6px 0;"><strong>Hình thức phỏng vấn:</strong> ${modeLabel}</p>
        <p style="margin: 6px 0;"><strong>${params.mode === InterviewMode.ONLINE ? 'Đường dẫn tham dự:' : 'Địa điểm phỏng vấn:'}</strong> ${
          params.mode === InterviewMode.ONLINE && params.meetingLink
            ? `<a href="${this.escapeHtml(params.meetingLink)}" style="color: #047857; font-weight: 600;">${this.escapeHtml(params.meetingLink)}</a>`
            : this.escapeHtml(placeValue)
        }</p>
        <p style="margin: 6px 0;"><strong>Người phụ trách liên hệ:</strong> ${this.escapeHtml(params.contactName)} (${this.escapeHtml(params.contactEmail)}${params.contactPhone ? ` · ${this.escapeHtml(params.contactPhone)}` : ''})</p>
        ${params.note ? `<p style="margin: 10px 0 4px 0;"><strong>Ghi chú từ doanh nghiệp:</strong><br/>${this.escapeHtml(params.note).replace(/\n/g, '<br/>')}</p>` : ''}
      </div>
      <p style="margin: 0;">
        Nếu bạn cần trao đổi thêm hoặc có đề xuất điều chỉnh lịch hẹn, vui lòng <strong>phản hồi trực tiếp (Reply) email này</strong> để liên hệ với bộ phận tuyển dụng của doanh nghiệp.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Lịch hẹn phỏng vấn',
      heading: 'Thư mời phỏng vấn thực tập',
      bodyHtml,
      ctaLabel: 'Xem chi tiết trên CareerBridge',
      ctaUrl: this.getFrontendUrl(),
      footerNote:
        'Email này kèm theo tệp lịch (.ics) để bạn thuận tiện lưu lịch hẹn vào Google Calendar hoặc Outlook.',
    });

    const icsContent = this.buildIcs({
      uid: `interview-${params.applicationId}`,
      start: params.scheduledAt,
      summary: `Phỏng vấn thực tập: ${params.internshipTitle} - ${params.companyName}`,
      description: `Phỏng vấn vị trí ${params.internshipTitle} tại ${params.companyName}. Người liên hệ: ${params.contactName} (${params.contactEmail}). ${params.note ?? ''}`,
      location: placeValue,
      organizerEmail: params.contactEmail,
      organizerName: params.contactName,
    });

    return {
      subject,
      html,
      replyTo: params.contactEmail,
      icsContent,
    };
  }

  renderOfferSentTemplate(params: {
    studentName: string;
    companyName: string;
    internshipTitle: string;
    startDate: Date | null;
    endDate: Date | null;
    offerExpiresAt: Date;
    offerMessage?: string | null;
    contactEmail?: string | null;
  }): RenderedEmailTemplate {
    const subject = `[CareerBridge] Thư mời nhận thực tập vị trí "${params.internshipTitle}" — ${params.companyName}`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Thân gửi <strong>${this.escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        Chúc mừng bạn đã vượt qua vòng phỏng vấn cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong>! Doanh nghiệp <strong>${this.escapeHtml(params.companyName)}</strong> trân trọng gửi đến bạn lời mời tiếp nhận thực tập chính thức với các thông tin sau:
      </p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Vị trí tiếp nhận:</strong> ${this.escapeHtml(params.internshipTitle)}</p>
        <p style="margin: 6px 0;"><strong>Đơn vị thực tập:</strong> ${this.escapeHtml(params.companyName)}</p>
        <p style="margin: 6px 0;"><strong>Thời gian thực tập dự kiến:</strong> ${this.escapeHtml(this.formatViDate(params.startDate))} – ${this.escapeHtml(this.formatViDate(params.endDate))}</p>
        <p style="margin: 6px 0;"><strong>Thời hạn xác nhận lời mời:</strong> ${this.escapeHtml(this.formatViDateTime(params.offerExpiresAt))}</p>
        ${params.offerMessage ? `<p style="margin: 10px 0 4px 0;"><strong>Hướng dẫn tiếp nhận từ doanh nghiệp:</strong><br/>${this.escapeHtml(params.offerMessage).replace(/\n/g, '<br/>')}</p>` : ''}
      </div>
      <p style="margin: 0;">
        Vui lòng đăng nhập vào hệ thống CareerBridge để xác nhận <strong>"Đồng ý nhận thực tập"</strong> hoặc <strong>"Từ chối"</strong> trước thời hạn nêu trên. Lưu ý: Khi bạn xác nhận thực tập tại đơn vị này, các hồ sơ ứng tuyển khác của bạn trong cùng học kỳ sẽ tự động khép lại.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Kết quả tuyển dụng',
      heading: 'Chúc mừng bạn nhận được lời mời thực tập!',
      bodyHtml,
      ctaLabel: 'Xác nhận lời mời trên CareerBridge',
      ctaUrl: this.getFrontendUrl(),
    });

    return {
      subject,
      html,
      replyTo: params.contactEmail || undefined,
    };
  }

  renderOfferReminderTemplate(params: {
    studentName: string;
    companyName: string;
    internshipTitle: string;
    offerExpiresAt: Date;
  }): RenderedEmailTemplate {
    const subject = `[CareerBridge] Nhắc hạn xác nhận lời mời thực tập vị trí "${params.internshipTitle}" — ${params.companyName}`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Thân gửi <strong>${this.escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 14px 0;">
        Hệ thống CareerBridge xin nhắc bạn: Lời mời thực tập cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong> sẽ hết thời hạn xác nhận vào lúc <strong>${this.escapeHtml(this.formatViDateTime(params.offerExpiresAt))}</strong>.
      </p>
      <p style="margin: 0;">
        Để không bỏ lỡ cơ hội thực tập này, bạn vui lòng đăng nhập vào hệ thống và phản hồi trước thời điểm trên. Sau thời hạn quy định, lời mời thực tập sẽ tự động hết hiệu lực để doanh nghiệp xét duyệt ứng viên tiếp theo.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Nhắc hạn phản hồi',
      badgeColor: '#fef3c7',
      ctaColor: '#d97706',
      heading: 'Lời mời thực tập của bạn sắp hết thời hạn xác nhận',
      bodyHtml,
      ctaLabel: 'Phản hồi lời mời ngay',
      ctaUrl: this.getFrontendUrl(),
    });

    return { subject, html };
  }

  renderOfferAcceptedCompanyTemplate(params: {
    companyName: string;
    studentName: string;
    studentEmail: string;
    internshipTitle: string;
    startDate: Date | null;
    endDate: Date | null;
  }): RenderedEmailTemplate {
    const subject = `[CareerBridge] Ứng viên ${params.studentName} đã xác nhận nhận thực tập — Vị trí "${params.internshipTitle}"`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Kính gửi Quý đối tác <strong>${this.escapeHtml(params.companyName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        Hệ thống CareerBridge trân trọng thông báo: Ứng viên <strong>${this.escapeHtml(params.studentName)}</strong> đã chính thức xác nhận đồng ý nhận lời mời thực tập cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại Quý doanh nghiệp.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Họ và tên thực tập sinh:</strong> ${this.escapeHtml(params.studentName)}</p>
        <p style="margin: 6px 0;"><strong>Email liên hệ:</strong> ${this.escapeHtml(params.studentEmail)}</p>
        <p style="margin: 6px 0;"><strong>Vị trí tiếp nhận:</strong> ${this.escapeHtml(params.internshipTitle)}</p>
        <p style="margin: 6px 0;"><strong>Thời gian thực tập:</strong> ${this.escapeHtml(this.formatViDate(params.startDate))} – ${this.escapeHtml(this.formatViDate(params.endDate))}</p>
      </div>
      <p style="margin: 0;">
        Hồ sơ thực tập của sinh viên đã được khởi tạo trên hệ thống và đang chờ nhà trường phân công giảng viên hướng dẫn. Quý doanh nghiệp có thể phản hồi trực tiếp email này để hướng dẫn thủ tục tiếp nhận cho sinh viên.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Xác nhận tiếp nhận thực tập',
      heading: 'Ứng viên đã xác nhận nhận lời mời thực tập',
      bodyHtml,
      ctaLabel: 'Quản lý thực tập sinh trên CareerBridge',
      ctaUrl: this.getFrontendUrl(),
    });

    return { subject, html, replyTo: params.studentEmail };
  }

  renderOfferDeclinedCompanyTemplate(params: {
    companyName: string;
    studentName: string;
    internshipTitle: string;
    reasonLabel: string;
  }): RenderedEmailTemplate {
    const normalizedReason = params.reasonLabel
      .replace(/\s*\((DECLINED|EXPIRED)\)\s*/gi, '')
      .trim();
    const subject = `[CareerBridge] Cập nhật phản hồi lời mời thực tập vị trí "${params.internshipTitle}" (${params.studentName})`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Kính gửi Quý đối tác <strong>${this.escapeHtml(params.companyName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        Hệ thống CareerBridge xin thông báo cập nhật về lời mời thực tập cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> đã gửi tới ứng viên <strong>${this.escapeHtml(params.studentName)}</strong>:
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Ứng viên:</strong> ${this.escapeHtml(params.studentName)}</p>
        <p style="margin: 6px 0;"><strong>Vị trí tuyển dụng:</strong> ${this.escapeHtml(params.internshipTitle)}</p>
        <p style="margin: 6px 0;"><strong>Tình trạng phản hồi:</strong> ${this.escapeHtml(normalizedReason)}</p>
      </div>
      <p style="margin: 0;">
        Chỉ tiêu tuyển dụng của vị trí này đã được hệ thống tự động hoàn lại. Quý doanh nghiệp có thể tiếp tục xét duyệt và gửi lời mời thực tập cho các ứng viên phù hợp khác trên CareerBridge.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Cập nhật tuyển dụng',
      badgeColor: '#f1f5f9',
      ctaColor: '#334155',
      heading: 'Thông báo cập nhật phản hồi lời mời thực tập',
      bodyHtml,
      ctaLabel: 'Xem danh sách ứng viên',
      ctaUrl: this.getFrontendUrl(),
    });

    return { subject, html };
  }

  renderApplicationRejectedTemplate(params: {
    studentName: string;
    companyName: string;
    internshipTitle: string;
    afterInterview: boolean;
    rejectionReason?: string | null;
    companyFeedback?: string | null;
    contactEmail?: string | null;
  }): RenderedEmailTemplate {
    const subject = `[CareerBridge] Phản hồi kết quả ứng tuyển vị trí "${params.internshipTitle}" — ${params.companyName}`;
    const intro = params.afterInterview
      ? `Cảm ơn bạn đã dành thời gian tham dự buổi phỏng vấn cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong>.`
      : `Cảm ơn bạn đã quan tâm và gửi hồ sơ ứng tuyển cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong>.`;

    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Thân gửi <strong>${this.escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 14px 0;">${intro}</p>
      <p style="margin: 0 0 16px 0;">
        Sau quá trình xem xét và đánh giá kỹ lưỡng, rất tiếc doanh nghiệp chưa thể đồng hành cùng bạn trong đợt tuyển dụng này do định hướng và tiêu chí ưu tiên của vị trí hiện tại.
      </p>
      ${
        params.rejectionReason || params.companyFeedback
          ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
              ${params.rejectionReason ? `<p style="margin: 6px 0;"><strong>Lý do phản hồi:</strong> ${this.escapeHtml(params.rejectionReason)}</p>` : ''}
              ${params.companyFeedback ? `<p style="margin: 8px 0 4px 0;"><strong>Chia sẻ từ doanh nghiệp:</strong><br/>${this.escapeHtml(params.companyFeedback).replace(/\n/g, '<br/>')}</p>` : ''}
            </div>`
          : ''
      }
      <p style="margin: 0;">
        Chúc bạn luôn giữ vững sự chủ động và sớm tìm được cơ hội thực tập phù hợp trên hệ thống CareerBridge!
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Phản hồi ứng tuyển',
      badgeColor: '#f1f5f9',
      ctaColor: '#334155',
      heading: 'Thông báo kết quả ứng tuyển thực tập',
      bodyHtml,
      ctaLabel: 'Tìm kiếm cơ hội thực tập khác',
      ctaUrl: this.getFrontendUrl(),
    });

    return {
      subject,
      html,
      replyTo: params.contactEmail || undefined,
    };
  }

  renderWithdrawnByPlacementCompanyTemplate(params: {
    companyName: string;
    studentName: string;
    internshipTitle: string;
  }): RenderedEmailTemplate {
    const subject = `[CareerBridge] Thông báo tự động đóng hồ sơ ứng tuyển — Ứng viên ${params.studentName}`;
    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Kính gửi Quý đối tác <strong>${this.escapeHtml(params.companyName)}</strong>,</p>
      <p style="margin: 0 0 14px 0;">
        Ứng viên <strong>${this.escapeHtml(params.studentName)}</strong> (ứng tuyển vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong>) vừa chính thức xác nhận tham gia thực tập tại một doanh nghiệp khác trong học kỳ này.
      </p>
      <p style="margin: 0;">
        Theo quy chế quản lý thực tập của nhà trường (mỗi sinh viên chỉ tham gia một vị trí thực tập chính thức trong học kỳ), hồ sơ ứng tuyển của sinh viên tại Quý doanh nghiệp đã được hệ thống tự động đóng lại và hoàn trả chỉ tiêu tuyển dụng (nếu có).
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: 'Cập nhật hồ sơ ứng viên',
      badgeColor: '#f1f5f9',
      ctaColor: '#334155',
      heading: 'Thông báo tự động đóng hồ sơ ứng tuyển',
      bodyHtml,
      ctaLabel: 'Quản lý hồ sơ ứng tuyển',
      ctaUrl: this.getFrontendUrl(),
    });

    return { subject, html };
  }

  renderCampaignExpiredStudentTemplate(params: {
    studentName: string;
    companyName: string;
    internshipTitle: string;
    reasonText: string;
  }): RenderedEmailTemplate {
    const isOfferExpired =
      params.reasonText.toLowerCase().includes('lời mời') ||
      params.reasonText.toLowerCase().includes('offer');
    const cleanReason = params.reasonText.replace(/\s*\(Offer\)\s*/gi, '').trim();

    const subject = isOfferExpired
      ? `[CareerBridge] Lời mời thực tập đã hết thời hạn xác nhận — Vị trí "${params.internshipTitle}"`
      : `[CareerBridge] Thông báo khép lại hồ sơ ứng tuyển vị trí "${params.internshipTitle}" — ${params.companyName}`;

    const bodyHtml = `
      <p style="margin: 0 0 12px 0;">Thân gửi <strong>${this.escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 16px 0;">
        ${
          isOfferExpired
            ? `Hệ thống CareerBridge xin thông báo: Lời mời thực tập của bạn cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong> đã hết hiệu lực do quá thời hạn xác nhận quy định.`
            : `Hệ thống CareerBridge xin thông báo: Hồ sơ ứng tuyển của bạn cho vị trí <strong>"${this.escapeHtml(params.internshipTitle)}"</strong> tại <strong>${this.escapeHtml(params.companyName)}</strong> đã tự động khép lại do thời gian tuyển dụng của học kỳ đã kết thúc.`
        }
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Vị trí ứng tuyển:</strong> ${this.escapeHtml(params.internshipTitle)}</p>
        <p style="margin: 6px 0;"><strong>Đơn vị tuyển dụng:</strong> ${this.escapeHtml(params.companyName)}</p>
        <p style="margin: 6px 0;"><strong>Nguyên nhân đóng hồ sơ:</strong> ${this.escapeHtml(cleanReason)}</p>
      </div>
      <p style="margin: 0;">
        Bạn có thể đăng nhập vào hệ thống CareerBridge để theo dõi các hồ sơ ứng tuyển khác hoặc tìm kiếm cơ hội thực tập mới phù hợp với định hướng của mình.
      </p>
    `;

    const html = this.wrapEmailLayout({
      badge: isOfferExpired ? 'Hết thời hạn xác nhận' : 'Kết thúc đợt tuyển dụng',
      badgeColor: '#f1f5f9',
      ctaColor: '#334155',
      heading: isOfferExpired
        ? 'Thông báo lời mời thực tập đã hết thời hạn xác nhận'
        : 'Thông báo khép lại hồ sơ ứng tuyển',
      bodyHtml,
      ctaLabel: 'Truy cập CareerBridge',
      ctaUrl: this.getFrontendUrl(),
    });

    return { subject, html };
  }

  async sendAndLogApplicationEmail(params: {
    applicationId: string;
    type: EmailLogType;
    to: string;
    template: RenderedEmailTemplate;
  }) {
    const { applicationId, type, to, template } = params;
    try {
      await this.transporter.sendMail({
        from: `"CareerBridge" <${this.getFromAddress()}>`,
        to,
        ...(template.replyTo ? { replyTo: template.replyTo } : {}),
        subject: template.subject,
        html: template.html,
        ...(template.icsContent
          ? {
              attachments: [
                {
                  filename: 'interview-invite.ics',
                  content: template.icsContent,
                  contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                },
              ],
            }
          : {}),
      });
      this.logger.log(`Email [${type}] sent to ${to}`);
      return await this.prisma.emailLog.create({
        data: {
          applicationId,
          type,
          to,
          replyTo: template.replyTo ?? null,
          subject: template.subject,
          html: template.html,
          icsContent: template.icsContent ?? null,
          status: EmailLogStatus.SENT,
          error: null,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(
        `Failed to send email [${type}] to ${to}: ${errorMessage}`,
      );
      return await this.prisma.emailLog.create({
        data: {
          applicationId,
          type,
          to,
          replyTo: template.replyTo ?? null,
          subject: template.subject,
          html: template.html,
          icsContent: template.icsContent ?? null,
          status: EmailLogStatus.FAILED,
          error: errorMessage,
        },
      });
    }
  }

  async resendEmailLog(applicationId: string, logId: string) {
    const existing = await this.prisma.emailLog.findFirst({
      where: { id: logId, applicationId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'EMAIL_LOG_NOT_FOUND',
        message: 'Email log not found',
      });
    }
    try {
      await this.transporter.sendMail({
        from: `"CareerBridge" <${this.getFromAddress()}>`,
        to: existing.to,
        ...(existing.replyTo ? { replyTo: existing.replyTo } : {}),
        subject: existing.subject,
        html: existing.html,
        ...(existing.icsContent
          ? {
              attachments: [
                {
                  filename: 'interview-invite.ics',
                  content: existing.icsContent,
                  contentType: 'text/calendar; charset=utf-8; method=REQUEST',
                },
              ],
            }
          : {}),
      });
      return await this.prisma.emailLog.update({
        where: { id: existing.id },
        data: {
          status: EmailLogStatus.SENT,
          error: null,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      return await this.prisma.emailLog.update({
        where: { id: existing.id },
        data: {
          status: EmailLogStatus.FAILED,
          error: errorMessage,
          sentAt: new Date(),
        },
      });
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = this.getFrontendUrl();
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const bodyHtml = `
      <p style="margin: 0 0 14px 0;">Xin chào,</p>
      <p style="margin: 0 0 16px 0;">
        Cảm ơn bạn đã đăng ký tài khoản trên hệ thống <strong>CareerBridge</strong>. Để hoàn tất quá trình đăng ký và kích hoạt tài khoản, bạn vui lòng nhấn vào nút xác thực bên dưới:
      </p>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;">
        Hoặc sao chép đường dẫn sau vào trình duyệt của bạn (đường dẫn có hiệu lực trong vòng 24 giờ):
      </p>
      <p style="margin: 0 0 14px 0; word-break: break-all; font-size: 13px; color: #047857;">
        ${this.escapeHtml(verificationLink)}
      </p>
    `;

    const mailOptions = {
      from: `"CareerBridge" <${this.getFromAddress()}>`,
      to,
      subject: '[CareerBridge] Xác thực địa chỉ email tài khoản của bạn',
      html: this.wrapEmailLayout({
        badge: 'Bảo mật tài khoản',
        heading: 'Xác thực địa chỉ email tài khoản CareerBridge',
        bodyHtml,
        ctaLabel: 'Xác thực địa chỉ email',
        ctaUrl: verificationLink,
        footerNote:
          'Nếu bạn không thực hiện đăng ký tài khoản trên CareerBridge, vui lòng bỏ qua email này.',
      }),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.getFrontendUrl();
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const bodyHtml = `
      <p style="margin: 0 0 14px 0;">Xin chào,</p>
      <p style="margin: 0 0 16px 0;">
        Hệ thống <strong>CareerBridge</strong> vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản gắn với địa chỉ email này. Bạn vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới:
      </p>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;">
        Đường dẫn đặt lại mật khẩu chỉ có hiệu lực trong vòng <strong>30 phút</strong> và chỉ sử dụng được một lần:
      </p>
      <p style="margin: 0 0 14px 0; word-break: break-all; font-size: 13px; color: #047857;">
        ${this.escapeHtml(resetLink)}
      </p>
    `;

    await this.transporter.sendMail({
      from: `"CareerBridge" <${this.getFromAddress()}>`,
      to,
      subject: '[CareerBridge] Yêu cầu đặt lại mật khẩu tài khoản',
      html: this.wrapEmailLayout({
        badge: 'Bảo mật tài khoản',
        heading: 'Thiết lập lại mật khẩu tài khoản CareerBridge',
        bodyHtml,
        ctaLabel: 'Đặt lại mật khẩu mới',
        ctaUrl: resetLink,
        footerNote:
          'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn hoàn toàn an toàn.',
      }),
    });
    this.logger.log(`Password reset email sent to ${to}`);
  }
}
