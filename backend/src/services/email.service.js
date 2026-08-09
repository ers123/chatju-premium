// backend/src/services/email.service.js
// Email delivery service using Resend

const logger = require('../utils/logger');

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const { Resend } = require('resend');
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = 'SoMyung <noreply@somyung.cc>';
const REPLY_TO = 'support@somyung.cc';
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || 'https://somyung.cc';

const EMAIL_COPY = {
  ko: {
    subject: (name) => `${name}의 사주팔자 프리미엄 리포트 - SoMyung`,
    title: (name) => `${name}의 사주팔자 리포트`,
    subtitle: 'SoMyung 프리미엄 분석 결과',
    chart: '사주 정보',
    birthDate: '생년월일',
    gender: '성별',
    male: '남아',
    female: '여아',
    pillars: ['년주', '월주', '일주', '시주'],
    summary: '리포트 요약',
    cta: 'PDF 리포트 다운로드',
    footer: '이 이메일은 SoMyung 프리미엄 리포트 발송용입니다.',
  },
  en: {
    subject: (name) => `${name}'s Premium Saju Report - SoMyung`,
    title: (name) => `${name}'s Saju Report`,
    subtitle: 'SoMyung Premium Analysis',
    chart: 'Birth Chart',
    birthDate: 'Birth Date',
    gender: 'Gender',
    male: 'Boy',
    female: 'Girl',
    pillars: ['Year', 'Month', 'Day', 'Hour'],
    summary: 'Report Summary',
    cta: 'Download PDF Report',
    footer: 'This email was sent by SoMyung Premium Report.',
  },
  ja: {
    subject: (name) => `${name}のプレミアム四柱推命レポート - SoMyung`,
    title: (name) => `${name}の四柱推命レポート`,
    subtitle: 'SoMyung プレミアム分析結果',
    chart: '命式情報',
    birthDate: '生年月日',
    gender: '性別',
    male: '男の子',
    female: '女の子',
    pillars: ['年柱', '月柱', '日柱', '時柱'],
    summary: 'レポート要約',
    cta: 'PDFレポートをダウンロード',
    footer: 'このメールはSoMyungプレミアムレポート送信用です。',
  },
  zh: {
    subject: (name) => `${name}的高级四柱八字报告 - SoMyung`,
    title: (name) => `${name}的四柱八字报告`,
    subtitle: 'SoMyung 高级分析结果',
    chart: '命盘信息',
    birthDate: '出生日期',
    gender: '性别',
    male: '男孩',
    female: '女孩',
    pillars: ['年柱', '月柱', '日柱', '时柱'],
    summary: '报告摘要',
    cta: '下载 PDF 报告',
    footer: '这封邮件用于发送 SoMyung 高级报告。',
  },
  vi: {
    subject: (name) => `Báo cáo Saju cao cấp của ${name} - SoMyung`,
    title: (name) => `Báo cáo Saju của ${name}`,
    subtitle: 'Kết quả phân tích cao cấp SoMyung',
    chart: 'Lá số khai sinh',
    birthDate: 'Ngày sinh',
    gender: 'Giới tính',
    male: 'Bé trai',
    female: 'Bé gái',
    pillars: ['Năm', 'Tháng', 'Ngày', 'Giờ'],
    summary: 'Tóm tắt báo cáo',
    cta: 'Tải báo cáo PDF',
    footer: 'Email này được gửi bởi Báo cáo cao cấp SoMyung.',
  },
  id: {
    subject: (name) => `Laporan Saju Premium ${name} - SoMyung`,
    title: (name) => `Laporan Saju ${name}`,
    subtitle: 'Hasil Analisis Premium SoMyung',
    chart: 'Bagan Kelahiran',
    birthDate: 'Tanggal Lahir',
    gender: 'Jenis Kelamin',
    male: 'Anak laki-laki',
    female: 'Anak perempuan',
    pillars: ['Tahun', 'Bulan', 'Hari', 'Jam'],
    summary: 'Ringkasan Laporan',
    cta: 'Unduh Laporan PDF',
    footer: 'Email ini dikirim oleh Laporan Premium SoMyung.',
  },
  es: {
    subject: (name) => `Informe Saju Premium de ${name} - SoMyung`,
    title: (name) => `Informe Saju de ${name}`,
    subtitle: 'Análisis Premium de SoMyung',
    chart: 'Carta de nacimiento',
    birthDate: 'Fecha de nacimiento',
    gender: 'Género',
    male: 'Niño',
    female: 'Niña',
    pillars: ['Año', 'Mes', 'Día', 'Hora'],
    summary: 'Resumen del informe',
    cta: 'Descargar informe PDF',
    footer: 'Este email fue enviado por el informe Premium de SoMyung.',
  },
  pt: {
    subject: (name) => `Relatório Saju Premium de ${name} - SoMyung`,
    title: (name) => `Relatório Saju de ${name}`,
    subtitle: 'Análise Premium SoMyung',
    chart: 'Mapa de nascimento',
    birthDate: 'Data de nascimento',
    gender: 'Gênero',
    male: 'Menino',
    female: 'Menina',
    pillars: ['Ano', 'Mês', 'Dia', 'Hora'],
    summary: 'Resumo do relatório',
    cta: 'Baixar relatório PDF',
    footer: 'Este email foi enviado pelo Relatório Premium SoMyung.',
  },
  fr: {
    subject: (name) => `Rapport Saju Premium de ${name} - SoMyung`,
    title: (name) => `Rapport Saju de ${name}`,
    subtitle: 'Analyse Premium SoMyung',
    chart: 'Thème de naissance',
    birthDate: 'Date de naissance',
    gender: 'Genre',
    male: 'Garçon',
    female: 'Fille',
    pillars: ['Année', 'Mois', 'Jour', 'Heure'],
    summary: 'Résumé du rapport',
    cta: 'Télécharger le rapport PDF',
    footer: 'Cet email a été envoyé par le rapport Premium SoMyung.',
  },
  th: {
    subject: (name) => `รายงาน Saju พรีเมียมของ ${name} - SoMyung`,
    title: (name) => `รายงาน Saju ของ ${name}`,
    subtitle: 'ผลการวิเคราะห์พรีเมียมจาก SoMyung',
    chart: 'แผนภูมิวันเกิด',
    birthDate: 'วันเกิด',
    gender: 'เพศ',
    male: 'เด็กชาย',
    female: 'เด็กหญิง',
    pillars: ['ปี', 'เดือน', 'วัน', 'เวลา'],
    summary: 'สรุปรายงาน',
    cta: 'ดาวน์โหลดรายงาน PDF',
    footer: 'อีเมลนี้ส่งโดยรายงานพรีเมียมของ SoMyung',
  },
};

function getEmailCopy(language) {
  return EMAIL_COPY[language] || EMAIL_COPY.en;
}

/**
 * Send a premium report email
 *
 * @param {Object} params
 * @param {string} params.email - Recipient email
 * @param {string} params.childName - Child's name
 * @param {string} params.readingId - Reading UUID
 * @param {Object} params.manseryeok - Manseryeok result
 * @param {Object} params.aiInterpretation - AI interpretation
 * @param {string} params.birthDate - Birth date
 * @param {string} params.gender - Gender
 * @param {string} params.language - Language code
 * @param {string} [params.reportAccessToken] - Short-lived report access token
 * @param {Buffer} [params.pdfBuffer] - Optional PDF attachment
 */
async function sendReportEmail(params) {
  const {
    email,
    childName,
    readingId,
    manseryeok,
    aiInterpretation,
    birthDate,
    gender,
    language = 'ko',
    reportAccessToken,
    pdfBuffer,
    // Caller ran out of time budget: send the email body (which carries a PDF
    // download link) rather than spend seconds rendering an attachment.
    skipPdf = false,
  } = params;

  const resend = getResendClient();
  const copy = getEmailCopy(language);
  const displayName = childName || (language === 'ko' ? '아이' : 'Child');
  const subject = copy.subject(displayName);
  const attachmentFilename = 'SoMyung_Report.pdf';

  const htmlContent = buildReportEmailHtml({
    displayName,
    readingId,
    manseryeok,
    aiInterpretation,
    birthDate,
    gender,
    language,
    reportAccessToken,
  });

  const emailPayload = {
    from: FROM_EMAIL,
    to: [email],
    reply_to: REPLY_TO,
    subject,
    html: htmlContent,
  };

  // Attach PDF if available
  if (pdfBuffer) {
    emailPayload.attachments = [
      {
        filename: attachmentFilename,
        content: pdfBuffer,
        content_type: 'application/pdf',
      },
    ];
  } else if (skipPdf) {
    logger.warn('[Email Service] Skipping PDF attachment (caller out of time budget); email links to the PDF instead');
  } else {
    // Try to generate PDF
    try {
      const pdfService = require('./pdf.service');
      const generatedPdf = await pdfService.generateReportPDF({
        childName: displayName,
        birthDate,
        gender,
        manseryeok,
        aiInterpretation,
        language,
      });
      if (generatedPdf) {
        emailPayload.attachments = [
          {
            filename: attachmentFilename,
            content: generatedPdf,
            content_type: 'application/pdf',
          },
        ];
      }
    } catch (pdfErr) {
      logger.warn('[Email Service] PDF generation failed, sending without attachment:', pdfErr.message);
    }
  }

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    logger.error('[Email Service] Resend API error:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  logger.info('[Email Service] Email sent successfully:', { emailId: data?.id, to: email });
  return data;
}

/**
 * Build HTML email template for report delivery
 */
function buildReportUrl(readingId, reportAccessToken, language) {
  const params = new URLSearchParams({ readingId, lang: language || 'en' });
  if (reportAccessToken) params.set('token', reportAccessToken);
  return `${FRONTEND_BASE_URL.replace(/\/$/, '')}/report/pdf?${params.toString()}`;
}

function buildReportEmailHtml({ displayName, readingId, manseryeok, aiInterpretation, birthDate, gender, language, reportAccessToken }) {
  const copy = getEmailCopy(language);
  const pillars = manseryeok?.pillars;
  const genderLabel = gender === 'male' ? copy.male : copy.female;

  // Extract first section as summary, strip markdown only (한자는 유지)
  const sections = aiInterpretation?.sections || {};
  const summaryText = sections.executiveSummary || sections.preamble || aiInterpretation?.fullText?.substring(0, 500) || '';
  const cleanSummary = summaryText.replace(/[#*_`]/g, '').substring(0, 600);
  const reportUrl = buildReportUrl(readingId, reportAccessToken, language);

  // Table-based email layout for maximum email client compatibility
  const pillarHtml = pillars ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        ${copy.pillars.map((label, i) => {
          const keys = ['year', 'month', 'day', 'hour'];
          return `<td align="center" width="25%" style="padding: 4px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #3D3028; border-radius: 10px;">
              <tr><td align="center" style="padding: 10px 8px 4px; font-size: 11px; color: #C5A059;">${label}</td></tr>
              <tr><td align="center" style="padding: 4px 8px 12px; font-size: 20px; font-weight: bold; color: #FFFFFF;">${pillars[keys[i]]?.korean || '-'}</td></tr>
            </table>
          </td>`;
        }).join('')}
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F6; font-family: -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF8F6;">
    <tr><td align="center" style="padding: 24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px;">

        <!-- Header -->
        <tr><td align="center" style="padding: 32px 0 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="52" height="52" style="border-radius: 50%; background: #3D3028;">
            <tr><td align="center" valign="middle" style="color: #C5A059; font-size: 22px;">☯</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="font-size: 22px; font-weight: bold; color: #3D3028; padding: 12px 0 4px;">
          ${copy.title(displayName)}
        </td></tr>
        <tr><td align="center" style="font-size: 13px; color: #8B8580; padding: 0 0 28px;">
          ${copy.subtitle}
        </td></tr>

        <!-- Birth Info Card -->
        <tr><td style="background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE5DF; padding: 24px; margin-bottom: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="font-size: 16px; font-weight: bold; color: #3D3028; padding-bottom: 16px;">
              ${copy.chart}
            </td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #F0EDE9; font-size: 13px; color: #6B5E52;">
              <table width="100%"><tr>
                <td style="color: #8B8580;">${copy.birthDate}</td>
                <td align="right" style="font-weight: 600;">${birthDate}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #F0EDE9; font-size: 13px; color: #6B5E52;">
              <table width="100%"><tr>
                <td style="color: #8B8580;">${copy.gender}</td>
                <td align="right" style="font-weight: 600;">${genderLabel}</td>
              </tr></table>
            </td></tr>
            <tr><td>${pillarHtml}</td></tr>
          </table>
        </td></tr>

        <tr><td style="height: 12px;"></td></tr>

        <!-- Report Summary Card -->
        <tr><td style="background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE5DF; padding: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="font-size: 16px; font-weight: bold; color: #3D3028; padding-bottom: 12px;">
              ${copy.summary}
            </td></tr>
            <tr><td style="font-size: 14px; color: #6B5E52; line-height: 1.8; padding-bottom: 20px;">
              ${cleanSummary}...
            </td></tr>
            <tr><td align="center">
              <a href="${reportUrl}"
                 style="display: inline-block; background: #3D3028; color: #C5A059; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
                ${copy.cta}
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding: 28px 0 8px; font-size: 12px; color: #8B8580; line-height: 1.6;">
          ${copy.footer}
          <br/>somyung.cc
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Report lookup OTP email ──────────────────────────────────────────────

const OTP_EMAIL_COPY = {
  ko: {
    subject: 'SoMyung 리포트 조회 인증번호',
    title: '리포트 조회 인증번호',
    body: '아래 인증번호를 입력하면 리포트를 조회할 수 있습니다. 인증번호는 10분간 유효합니다.',
    ignore: '본인이 요청하지 않았다면 이 이메일을 무시하세요.',
  },
  en: {
    subject: 'Your SoMyung report verification code',
    title: 'Report Verification Code',
    body: 'Enter the code below to access your report. The code expires in 10 minutes.',
    ignore: 'If you did not request this, you can safely ignore this email.',
  },
  ja: {
    subject: 'SoMyung レポート確認コード',
    title: 'レポート確認コード',
    body: '以下のコードを入力するとレポートを確認できます。コードの有効期限は10分です。',
    ignore: '心当たりがない場合は、このメールを無視してください。',
  },
};

function getOtpEmailCopy(language) {
  return OTP_EMAIL_COPY[language] || OTP_EMAIL_COPY.en;
}

/**
 * Send a report-lookup OTP email.
 *
 * @param {string} email - Recipient (validated: standard format, no whitespace/CRLF)
 * @param {string} code - 6-digit numeric OTP
 * @param {string} [lang] - Language code (ko/en/ja supported, falls back to en)
 */
async function sendReportLookupOtp(email, code, lang = 'en') {
  // Guard against header injection / malformed recipients.
  // The regex forbids all whitespace (including CR/LF) in the address.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || !emailRegex.test(email) || /[\r\n]/.test(email)) {
    throw new Error('Invalid recipient email');
  }
  if (!/^\d{6}$/.test(String(code))) {
    throw new Error('Invalid OTP code format');
  }

  const resend = getResendClient();
  const copy = getOtpEmailCopy(lang);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #FAF8F6; font-family: -apple-system, 'Noto Sans KR', 'Malgun Gothic', sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF8F6;">
    <tr><td align="center" style="padding: 24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 480px;">
        <tr><td align="center" style="padding: 32px 0 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="52" height="52" style="border-radius: 50%; background: #3D3028;">
            <tr><td align="center" valign="middle" style="color: #C5A059; font-size: 22px;">☯</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="font-size: 20px; font-weight: bold; color: #3D3028; padding: 12px 0 16px;">
          ${copy.title}
        </td></tr>
        <tr><td style="background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE5DF; padding: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center" style="font-size: 14px; color: #6B5E52; line-height: 1.7; padding-bottom: 16px;">
              ${copy.body}
            </td></tr>
            <tr><td align="center" style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3D3028; padding: 8px 0 16px;">
              ${code}
            </td></tr>
            <tr><td align="center" style="font-size: 12px; color: #8B8580;">
              ${copy.ignore}
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding: 24px 0 8px; font-size: 12px; color: #8B8580;">
          somyung.cc
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    reply_to: REPLY_TO,
    subject: copy.subject,
    html,
  });

  if (error) {
    logger.error('[Email Service] OTP email Resend API error:', error);
    throw new Error(`OTP email send failed: ${error.message}`);
  }

  logger.info('[Email Service] OTP email sent:', { emailId: data?.id });
  return data;
}

module.exports = {
  sendReportEmail,
  sendReportLookupOtp,
};
