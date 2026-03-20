// backend/src/services/pdf.service.js
// PDF report generation using pdfkit

const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Noto Sans CJK KR — supports Korean, Chinese, Japanese characters including 한자
const FONT_PATH = path.join(__dirname, '../../assets/fonts/NotoSansCJKkr-Regular.otf');
const FONT_BOLD_PATH = path.join(__dirname, '../../assets/fonts/NotoSansCJKkr-Bold.otf');

/**
 * Generate a premium report PDF
 */
async function generateReportPDF(params) {
  const { childName, birthDate, gender, manseryeok, aiInterpretation } = params;

  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 70, left: 50, right: 50 },
        bufferPages: true, // Enable page buffering for footer
        info: {
          Title: `${childName || '아이'}의 사주팔자 리포트 - 소명`,
          Author: 'SoMyung (소명)',
          Subject: 'Premium Saju Report',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const hasFont = fs.existsSync(FONT_PATH);
      const hasBoldFont = fs.existsSync(FONT_BOLD_PATH);

      if (hasFont) doc.registerFont('Korean', FONT_PATH);
      if (hasBoldFont) doc.registerFont('KoreanBold', FONT_BOLD_PATH);

      const fontName = hasFont ? 'Korean' : 'Helvetica';
      const fontBold = hasBoldFont ? 'KoreanBold' : (hasFont ? 'Korean' : 'Helvetica-Bold');
      const pageW = doc.page.width;
      const contentW = pageW - 100; // 50 margin each side
      const bottomLimit = doc.page.height - 90; // Leave room for footer

      // Helper: ensure enough space, sync y with doc cursor, add page if needed
      function ensureSpace(needed) {
        // Sync y with pdfkit's actual cursor position
        if (doc.y > 60) y = doc.y;
        if (y > bottomLimit - needed) {
          doc.addPage();
          y = 60;
        }
      }

      // ===== PAGE 1: HEADER =====
      doc.rect(0, 0, pageW, 120).fill('#2D3A35');
      doc.font(fontBold).fontSize(24).fillColor('#C5A059')
        .text('소명 (SoMyung)', 50, 35, { align: 'center' });
      doc.font(fontName).fontSize(12).fillColor('#A09990')
        .text('사주팔자 프리미엄 리포트', 50, 65, { align: 'center' });
      doc.font(fontBold).fontSize(16).fillColor('#FFFFFF')
        .text(`${childName || '아이'}의 사주 분석`, 50, 88, { align: 'center' });

      let y = 145;

      // ===== BIRTH INFO =====
      doc.font(fontBold).fontSize(14).fillColor('#2D3A35').text('기본 정보', 50, y);
      y += 25;

      const genderLabel = gender === 'male' ? '남아' : '여아';
      doc.font(fontName).fontSize(11).fillColor('#6B5E52');
      doc.text(`생년월일: ${birthDate}`, 50, y);
      y += 18;
      doc.text(`성별: ${genderLabel}`, 50, y);
      y += 30;

      // ===== FOUR PILLARS =====
      const pillars = manseryeok?.pillars;
      if (pillars) {
        doc.font(fontBold).fontSize(14).fillColor('#2D3A35').text('사주팔자 (四柱八字)', 50, y);
        y += 25;

        const pillarLabels = ['년주', '월주', '일주', '시주'];
        const pillarKeys = ['year', 'month', 'day', 'hour'];
        const pillarWidth = 110;
        const startX = (pageW - pillarWidth * 4 - 30) / 2;

        pillarKeys.forEach((key, i) => {
          const px = startX + i * (pillarWidth + 10);
          doc.roundedRect(px, y, pillarWidth, 60, 8).fill('#2D3A35');
          doc.font(fontName).fontSize(9).fillColor('#C5A059')
            .text(pillarLabels[i], px, y + 8, { width: pillarWidth, align: 'center' });
          doc.font(fontBold).fontSize(18).fillColor('#FFFFFF')
            .text(pillars[key]?.korean || '-', px, y + 28, { width: pillarWidth, align: 'center' });
        });

        y += 80;
      }

      // ===== FIVE ELEMENTS =====
      const elements = manseryeok?.elements;
      if (elements) {
        doc.font(fontBold).fontSize(14).fillColor('#2D3A35').text('오행 분석', 50, y);
        y += 25;

        const elementNames = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'];
        const elementKeys = ['wood', 'fire', 'earth', 'metal', 'water'];
        const elementColors = ['#5A7A66', '#A85544', '#B8922D', '#6B7578', '#556B7E'];
        const total = elementKeys.reduce((sum, k) => sum + (elements[k] || 0), 0) || 1;

        elementKeys.forEach((key, i) => {
          const value = elements[key] || 0;
          const pct = Math.round((value / total) * 100);
          const barWidth = Math.max(10, (value / total) * 300);

          doc.font(fontName).fontSize(10).fillColor('#6B5E52')
            .text(elementNames[i], 50, y, { width: 70 });
          doc.roundedRect(130, y + 2, barWidth, 14, 4).fill(elementColors[i]);
          doc.font(fontName).fontSize(9).fillColor('#8B8580')
            .text(`${value} (${pct}%)`, 440, y, { width: 60 });
          y += 22;
        });

        y += 15;
      }

      // ===== AI INTERPRETATION SECTIONS =====
      const sections = aiInterpretation?.sections || {};
      const sectionOrder = [
        { key: 'coreProfile', title: '사주 핵심 프로필' },
        { key: 'parentChildAnalysis', title: '부모-자녀 관계 분석' },
        { key: 'developmentGuide', title: '연령별 발달 가이드' },
        { key: 'careerAptitude', title: '진로/적성 심층 분석' },
        { key: 'fortuneCycles', title: '대운/세운 운세 흐름' },
        { key: 'monthlyFortune', title: '월별 운세 리포트' },
        { key: 'elementBalance', title: '오행 밸런스 & 개운법' },
        { key: 'weeklyActions', title: '이번 주 실천 과제' },
      ];

      for (const section of sectionOrder) {
        const content = sections[section.key];
        if (!content) continue;

        // Clean content: strip markdown + 한자
        let cleanContent = content
          .replace(/^#{1,4}\s+.*$/gm, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/^---+$/gm, '')
          .trim();

        // 한자 유지 — Noto Sans CJK KR이 한자/일본어/중국어 모두 지원

        // Always start section title with enough room (title + at least a few lines)
        ensureSpace(80);

        // Section divider line
        doc.moveTo(50, y).lineTo(pageW - 50, y).strokeColor('#EBE5DF').lineWidth(0.5).stroke();
        y += 12;

        // Section title
        doc.font(fontBold).fontSize(13).fillColor('#2D3A35').text(section.title, 50, y);
        y += 24;

        // Render entire section content, let pdfkit handle page breaks automatically
        doc.font(fontName).fontSize(10).fillColor('#6B5E52');
        doc.text(cleanContent, 50, y, { width: contentW, lineGap: 4 });

        // After text(), doc.y reflects the actual cursor position (even across page breaks)
        y = doc.y + 16;
      }

      // ===== FOOTER on every page =====
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.font(fontName).fontSize(7).fillColor('#B0A9A2')
          .text(
            `소명 (SoMyung) | somyung.pages.dev | ${new Date().toISOString().split('T')[0]} | ${i + 1}/${pageCount}`,
            50, doc.page.height - 45,
            { width: contentW, align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateReportPDF,
};
