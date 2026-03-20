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
    pdfBuffer,
  } = params;

  const resend = getResendClient();
  const displayName = childName || '아이';
  const isKorean = language === 'ko';

  const subject = isKorean
    ? `${displayName}의 사주팔자 프리미엄 리포트 - 소명`
    : `${displayName}'s Premium Saju Report - SoMyung`;

  const htmlContent = buildReportEmailHtml({
    displayName,
    readingId,
    manseryeok,
    aiInterpretation,
    birthDate,
    gender,
    isKorean,
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
        filename: `소명_${displayName}_${birthDate}.pdf`,
        content: pdfBuffer,
        content_type: 'application/pdf',
      },
    ];
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
      });
      if (generatedPdf) {
        emailPayload.attachments = [
          {
            filename: `소명_${displayName}_${birthDate}.pdf`,
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
function buildReportEmailHtml({ displayName, readingId, manseryeok, aiInterpretation, birthDate, gender, isKorean }) {
  const pillars = manseryeok?.pillars;
  const genderLabel = isKorean
    ? (gender === 'male' ? '남아' : '여아')
    : (gender === 'male' ? 'Boy' : 'Girl');

  // Extract first section as summary, strip markdown only (한자는 유지)
  const sections = aiInterpretation?.sections || {};
  const summaryText = sections.coreProfile || sections.preamble || aiInterpretation?.fullText?.substring(0, 500) || '';
  const cleanSummary = summaryText.replace(/[#*_`]/g, '').substring(0, 600);

  // Table-based email layout for maximum email client compatibility
  const pillarHtml = pillars ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        ${['년주', '월주', '일주', '시주'].map((label, i) => {
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
            <tr><td align="center" valign="middle" style="color: #C5A059; font-size: 20px; font-weight: bold; font-family: serif;">소</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="font-size: 22px; font-weight: bold; color: #3D3028; padding: 12px 0 4px;">
          ${displayName}${isKorean ? '의 사주팔자 리포트' : "'s Saju Report"}
        </td></tr>
        <tr><td align="center" style="font-size: 13px; color: #8B8580; padding: 0 0 28px;">
          ${isKorean ? '소명 프리미엄 분석 결과' : 'SoMyung Premium Analysis'}
        </td></tr>

        <!-- Birth Info Card -->
        <tr><td style="background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE5DF; padding: 24px; margin-bottom: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="font-size: 16px; font-weight: bold; color: #3D3028; padding-bottom: 16px;">
              ${isKorean ? '사주 정보' : 'Birth Chart'}
            </td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #F0EDE9; font-size: 13px; color: #6B5E52;">
              <table width="100%"><tr>
                <td style="color: #8B8580;">${isKorean ? '생년월일' : 'Birth Date'}</td>
                <td align="right" style="font-weight: 600;">${birthDate}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #F0EDE9; font-size: 13px; color: #6B5E52;">
              <table width="100%"><tr>
                <td style="color: #8B8580;">${isKorean ? '성별' : 'Gender'}</td>
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
              ${isKorean ? '리포트 요약' : 'Report Summary'}
            </td></tr>
            <tr><td style="font-size: 14px; color: #6B5E52; line-height: 1.8; padding-bottom: 20px;">
              ${cleanSummary}...
            </td></tr>
            <tr><td align="center">
              <a href="https://somyung.pages.dev/reading/${readingId}"
                 style="display: inline-block; background: #3D3028; color: #C5A059; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
                ${isKorean ? '전체 리포트 보기' : 'View Full Report'}
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding: 28px 0 8px; font-size: 12px; color: #8B8580; line-height: 1.6;">
          ${isKorean ? '이 이메일은 소명(SoMyung) 프리미엄 리포트 발송용입니다.' : 'This email was sent by SoMyung Premium Report.'}
          <br/>somyung.pages.dev
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = {
  sendReportEmail,
};
