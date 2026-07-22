// backend/src/services/pdf.service.js
// Premium PDF report generation using pdfkit — text-based, ~200-500KB

const path = require('path');
const fs = require('fs');
const { parseNumberedSections, normalizePresentation } = require('./report-presentation');

const FONTS_DIR = path.join(__dirname, '../../assets/fonts');
const FONT_MAP = {
  default: {
    family: 'NotoSansKR',
    regular: path.join(FONTS_DIR, 'NotoSansKR-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'NotoSansKR-Bold.ttf'),
  },
  ja: {
    family: 'NotoSansJP',
    regular: path.join(FONTS_DIR, 'NotoSansJP-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'NotoSansJP-Bold.ttf'),
  },
  th: {
    family: 'NotoSansThaiLooped',
    regular: path.join(FONTS_DIR, 'NotoSansThaiLooped-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'NotoSansThaiLooped-Bold.ttf'),
  },
};

// ─── i18n labels ────────────────────────────────────────────────────────────
const LABELS = {
  ko: {
    pillars: ['년주', '월주', '일주', '시주'],
    elements: ['목', '화', '토', '금', '수'],
    elementAnalysis: '오행 분석',
    fourPillars: '사주팔자',
    birthInfo: '기본 정보',
    birthDate: '생년월일',
    gender: '성별',
    male: '남자',
    female: '여자',
    premiumReport: '프리미엄 사주 리포트',
    generatedOn: '생성일',
    footer: 'SoMyung | somyung.cc',
  },
  en: {
    pillars: ['Year', 'Month', 'Day', 'Hour'],
    elements: ['Wood (木)', 'Fire (火)', 'Earth (土)', 'Metal (金)', 'Water (水)'],
    elementAnalysis: 'Five Elements Analysis',
    fourPillars: 'Four Pillars of Destiny',
    birthInfo: 'Basic Information',
    birthDate: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    premiumReport: 'Premium Saju Report',
    generatedOn: 'Generated on',
    footer: 'SoMyung | somyung.cc',
  },
  ja: {
    pillars: ['年柱', '月柱', '日柱', '時柱'],
    elements: ['木 (もく)', '火 (か)', '土 (ど)', '金 (きん)', '水 (すい)'],
    elementAnalysis: '五行分析',
    fourPillars: '四柱推命',
    birthInfo: '基本情報',
    birthDate: '生年月日',
    gender: '性別',
    male: '男性',
    female: '女性',
    premiumReport: 'プレミアム四柱推命レポート',
    generatedOn: '生成日',
    footer: 'SoMyung | somyung.cc',
  },
  zh: {
    pillars: ['年柱', '月柱', '日柱', '时柱'],
    elements: ['木', '火', '土', '金', '水'],
    elementAnalysis: '五行分析',
    fourPillars: '四柱八字',
    birthInfo: '基本信息',
    birthDate: '出生日期',
    gender: '性别',
    male: '男',
    female: '女',
    premiumReport: '高级四柱八字报告',
    generatedOn: '生成日期',
    footer: 'SoMyung | somyung.cc',
  },
  vi: {
    pillars: ['Năm', 'Tháng', 'Ngày', 'Giờ'],
    elements: ['Mộc (木)', 'Hỏa (火)', 'Thổ (土)', 'Kim (金)', 'Thủy (水)'],
    elementAnalysis: 'Phân tích Ngũ hành',
    fourPillars: 'Tứ trụ',
    birthInfo: 'Thông tin cơ bản',
    birthDate: 'Ngày sinh',
    gender: 'Giới tính',
    male: 'Nam',
    female: 'Nữ',
    premiumReport: 'Báo cáo Saju cao cấp',
    generatedOn: 'Ngày tạo',
    footer: 'SoMyung | somyung.cc',
  },
  id: {
    pillars: ['Tahun', 'Bulan', 'Hari', 'Jam'],
    elements: ['Kayu (木)', 'Api (火)', 'Tanah (土)', 'Logam (金)', 'Air (水)'],
    elementAnalysis: 'Analisis Lima Elemen',
    fourPillars: 'Empat Pilar',
    birthInfo: 'Informasi Dasar',
    birthDate: 'Tanggal Lahir',
    gender: 'Jenis Kelamin',
    male: 'Laki-laki',
    female: 'Perempuan',
    premiumReport: 'Laporan Saju Premium',
    generatedOn: 'Dibuat pada',
    footer: 'SoMyung | somyung.cc',
  },
  es: {
    pillars: ['Año', 'Mes', 'Día', 'Hora'],
    elements: ['Madera (木)', 'Fuego (火)', 'Tierra (土)', 'Metal (金)', 'Agua (水)'],
    elementAnalysis: 'Análisis de los Cinco Elementos',
    fourPillars: 'Cuatro Pilares',
    birthInfo: 'Información básica',
    birthDate: 'Fecha de nacimiento',
    gender: 'Género',
    male: 'Masculino',
    female: 'Femenino',
    premiumReport: 'Informe Saju Premium',
    generatedOn: 'Generado el',
    footer: 'SoMyung | somyung.cc',
  },
  pt: {
    pillars: ['Ano', 'Mês', 'Dia', 'Hora'],
    elements: ['Madeira (木)', 'Fogo (火)', 'Terra (土)', 'Metal (金)', 'Água (水)'],
    elementAnalysis: 'Análise dos Cinco Elementos',
    fourPillars: 'Quatro Pilares',
    birthInfo: 'Informações básicas',
    birthDate: 'Data de nascimento',
    gender: 'Gênero',
    male: 'Masculino',
    female: 'Feminino',
    premiumReport: 'Relatório Saju Premium',
    generatedOn: 'Gerado em',
    footer: 'SoMyung | somyung.cc',
  },
  fr: {
    pillars: ['Année', 'Mois', 'Jour', 'Heure'],
    elements: ['Bois (木)', 'Feu (火)', 'Terre (土)', 'Métal (金)', 'Eau (水)'],
    elementAnalysis: 'Analyse des Cinq Éléments',
    fourPillars: 'Quatre Piliers',
    birthInfo: 'Informations de base',
    birthDate: 'Date de naissance',
    gender: 'Genre',
    male: 'Masculin',
    female: 'Féminin',
    premiumReport: 'Rapport Saju Premium',
    generatedOn: 'Généré le',
    footer: 'SoMyung | somyung.cc',
  },
  th: {
    pillars: ['ปี', 'เดือน', 'วัน', 'เวลา'],
    elements: ['ไม้ (木)', 'ไฟ (火)', 'ดิน (土)', 'โลหะ (金)', 'น้ำ (水)'],
    elementAnalysis: 'การวิเคราะห์ธาตุทั้งห้า',
    fourPillars: 'เสาหลักทั้งสี่',
    birthInfo: 'ข้อมูลพื้นฐาน',
    birthDate: 'วันเกิด',
    gender: 'เพศ',
    male: 'ชาย',
    female: 'หญิง',
    premiumReport: 'รายงาน Saju พรีเมียม',
    generatedOn: 'สร้างเมื่อ',
    footer: 'SoMyung | somyung.cc',
  },
};

function getLabels(language) {
  return LABELS[language] || LABELS.en;
}

// ─── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  headerBg: '#2D3A35',
  gold: '#C5A059',
  darkText: '#2D3A35',
  bodyText: '#4A4440',
  lightText: '#8B8580',
  subtleText: '#B0A9A2',
  divider: '#EBE5DF',
  pillarBg: '#2D3A35',
  pageBg: '#FDFCFA',
};

const ELEMENT_COLORS = {
  wood: '#5A7A66',
  fire: '#A85544',
  earth: '#B8922D',
  metal: '#6B7578',
  water: '#556B7E',
};

// ─── Markdown parser ────────────────────────────────────────────────────────
// Returns an array of { type, text, items? } blocks
function parseMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Section header: ## N. Title
    const headerMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      blocks.push({ type: 'header', text: headerMatch[1].trim() });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      i++;
      continue;
    }

    // Table separator line (|---|---|) — skip
    if (/^\|[\s-:]+\|/.test(line.trim()) && line.includes('---')) {
      i++;
      continue;
    }

    // Table row (| col | col |) — convert to clean text
    if (/^\|.+\|$/.test(line.trim())) {
      const cells = line.trim().split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 0) {
        blocks.push({ type: 'text', text: cells.join(' — ') });
      }
      i++;
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      blocks.push({ type: 'blank' });
      i++;
      continue;
    }

    // Bullet list item
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const bm = lines[i].match(/^\s*[-*]\s+(.+)$/);
        if (!bm) break;
        items.push(bm[1].trim());
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // Numbered list item — preserve original numbers
    const numMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const nm = lines[i].match(/^\s*(\d+)\.\s+(.+)$/);
        if (!nm) break;
        items.push({ num: parseInt(nm[1], 10), text: nm[2].trim() });
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Regular text line
    blocks.push({ type: 'text', text: line.trim() });
    i++;
  }

  return blocks;
}

// Parse inline bold markers and return segments: [{ text, bold }]
function parseInline(text) {
  const segments = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: match.input.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  // Strip ALL remaining markdown artifacts — **, *, `, ~~, etc.
  return segments.map(s => ({
    ...s,
    text: s.text
      .replace(/\*\*(.+?)\*\*/g, '$1')   // leftover **bold**
      .replace(/\*([^*]+)\*/g, '$1')      // *italic*
      .replace(/`([^`]+)`/g, '$1')        // `code`
      .replace(/~~/g, '')                 // ~~strikethrough~~
      .replace(/\*\*/g, '')              // orphaned ** with no closing
      .replace(/\*/g, ''),               // orphaned single *
  }));
}


/**
 * Generate a premium report PDF
 */
async function generateReportPDF(params) {
  const { childName, birthDate, gender, manseryeok, aiInterpretation, language, generatedAt } = params;
  const labels = getLabels(language || 'ko');
  const reportDate = generatedAt ? new Date(generatedAt) : new Date();
  const reportDateLabel = reportDate.toISOString().split('T')[0];

  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `${childName || 'Child'} - ${labels.premiumReport} - SoMyung`,
          Author: 'SoMyung (somyung.cc)',
          Subject: labels.premiumReport,
          Creator: 'SoMyung PDF Engine',
          CreationDate: reportDate,
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register both supported font families so pdfkit can switch cleanly per language.
      const registeredFonts = {};
      for (const key of ['default', 'ja', 'th']) {
        const fontFiles = FONT_MAP[key];
        const hasFont = fs.existsSync(fontFiles.regular);
        const hasBoldFont = fs.existsSync(fontFiles.bold);

        console.log('[PDF] Font check:', {
          key,
          regularPath: fontFiles.regular,
          boldPath: fontFiles.bold,
          hasFont,
          hasBoldFont,
          regularSize: hasFont ? fs.statSync(fontFiles.regular).size : 0,
        });

        if (hasFont) doc.registerFont(`${fontFiles.family}-Regular`, fontFiles.regular);
        if (hasBoldFont) doc.registerFont(`${fontFiles.family}-Bold`, fontFiles.bold);

        registeredFonts[key] = {
          hasFont,
          hasBoldFont,
          regular: hasFont ? `${fontFiles.family}-Regular` : 'Helvetica',
          bold: hasBoldFont ? `${fontFiles.family}-Bold` : 'Helvetica-Bold',
        };
      }

      const activeFontKey = language === 'th' ? 'th' : (language === 'ja' || language === 'zh') ? 'ja' : 'default';
      const fontRegular = registeredFonts[activeFontKey].regular;
      const fontBold = registeredFonts[activeFontKey].bold;
      const pillarCardFont = registeredFonts.ja.bold || registeredFonts.ja.regular || fontBold;

      console.log('[PDF] Using fonts:', { fontRegular, fontBold });

      const PAGE_W = doc.page.width;   // 595.28 for A4
      const PAGE_H = doc.page.height;  // 841.89 for A4
      const MARGIN_L = 50;
      const MARGIN_R = 50;
      const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
      const FOOTER_Y = PAGE_H - 45;

      // ─── Helper: render rich text (with inline bold) ──────────────────
      function renderRichText(text, x, y, options = {}) {
        const {
          fontSize = 10,
          color = COLORS.bodyText,
          lineGap = 5,
          width = CONTENT_W,
          indent = 0,
        } = options;

        const segments = parseInline(text);
        const effectiveX = x + indent;
        const effectiveW = width - indent;

        // If no bold segments, use simple text for efficiency
        if (segments.length === 1 && !segments[0].bold) {
          doc.font(fontRegular).fontSize(fontSize).fillColor(color);
          doc.text(segments[0].text, effectiveX, y, { width: effectiveW, lineGap });
          return doc.y;
        }

        // Mixed bold/regular — use pdfkit's continued text
        doc.fontSize(fontSize).fillColor(color);
        let first = true;
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const isLast = i === segments.length - 1;
          doc.font(seg.bold ? fontBold : fontRegular);
          if (first) {
            doc.text(seg.text, effectiveX, y, {
              width: effectiveW,
              lineGap,
              continued: !isLast,
            });
            first = false;
          } else {
            doc.text(seg.text, {
              width: effectiveW,
              lineGap,
              continued: !isLast,
            });
          }
        }
        return doc.y;
      }

      // ─── Helper: ensure space on page ─────────────────────────────────
      // Only add page manually if there's genuinely no space.
      // Use a stricter threshold to avoid double-page-breaks
      // (pdfkit also auto-adds pages when text overflows)
      function ensureSpace(needed) {
        if (doc.y + needed > FOOTER_Y) {
          // Check if pdfkit already added a page (y would be near top)
          if (doc.y > 100) {
            doc.addPage();
          }
        }
      }

      // ─── Helper: draw gold divider line with section title ────────────
      function drawSectionHeader(title) {
        ensureSpace(50);

        const y = doc.y;

        // Thin gold line
        doc.moveTo(MARGIN_L, y)
          .lineTo(MARGIN_L + CONTENT_W, y)
          .strokeColor(COLORS.gold)
          .lineWidth(0.75)
          .stroke();

        // Section title
        doc.font(fontBold).fontSize(13).fillColor(COLORS.darkText);
        doc.text(title, MARGIN_L, y + 8, { width: CONTENT_W });
        doc.moveDown(0.5);
      }

      // ─── Structured reference-report renderer ───────────────────────
      // This is intentionally small: production Markdown remains supported,
      // while a caller with a validated presentation contract gets semantic
      // cards instead of fragile text-pattern guesses.
      function writePresentationCard(title, rows, accent = COLORS.gold) {
        const rowText = rows.map((row) => `${row.label ? `${row.label}  ` : ''}${row.text}`).join('\n\n');
        doc.font(fontRegular).fontSize(9.5);
        const bodyHeight = doc.heightOfString(rowText, { width: CONTENT_W - 36, lineGap: 4 });
        const height = Math.max(74, bodyHeight + 44);
        ensureSpace(height + 12);
        const y = doc.y;
        doc.roundedRect(MARGIN_L, y, CONTENT_W, height, 8).fill('#F5F1EA');
        doc.rect(MARGIN_L, y, 5, height).fill(accent);
        doc.font(fontBold).fontSize(10).fillColor(COLORS.darkText)
          .text(title, MARGIN_L + 18, y + 12, { width: CONTENT_W - 36 });
        let rowY = y + 31;
        for (const row of rows) {
          doc.font(fontBold).fontSize(8.5).fillColor(accent).text(row.label || '', MARGIN_L + 18, rowY, { width: 105 });
          doc.font(fontRegular).fontSize(9.5).fillColor(COLORS.bodyText)
            .text(row.text, MARGIN_L + 112, rowY, { width: CONTENT_W - 130, lineGap: 4 });
          rowY = doc.y + 7;
        }
        doc.y = y + height + 12;
      }

      function writeStructuredBlock(block) {
        const type = block.type || 'text';
        if (type === 'text' || type === 'note') {
          writePresentationCard(block.title || (type === 'note' ? '읽는 방법' : '오늘의 관찰'), [{ text: block.text || '' }], type === 'note' ? ELEMENT_COLORS.water : COLORS.gold);
          return;
        }
        if (type === 'insight') {
          writePresentationCard(block.title || '기질을 행동으로 번역하기', [
            { label: '보이는 근거', text: block.basis || '' },
            { label: '관찰할 모습', text: block.behavior || '' },
            { label: '오늘의 대응', text: block.action || '' },
          ], ELEMENT_COLORS.wood);
          return;
        }
        if (type === 'translator') {
          writePresentationCard(block.title || '오해를 번역해 보기', [
            { label: '겉으로는', text: block.looksLike || '' },
            { label: '실제로는', text: block.actual || '' },
            { label: '더 나은 말', text: block.response || '' },
          ], ELEMENT_COLORS.fire);
          return;
        }
        if (type === 'script') {
          writePresentationCard(block.title || '대화 스크립트', [
            { label: '이전', text: block.before || '' },
            { label: '이후', text: block.after || '' },
            { label: '기대 신호', text: block.signal || '' },
          ], ELEMENT_COLORS.water);
          return;
        }
        if (type === 'timeline') {
          writePresentationCard(block.title || '이번 시기의 참고 흐름', (block.items || []).map((item) => ({ label: item.label, text: item.text })), ELEMENT_COLORS.earth);
          return;
        }
        if (type === 'checklist') {
          writePresentationCard(block.title || '7일의 작은 실험', (block.items || []).map((item) => ({ label: item.label, text: `□ ${item.text}` })), ELEMENT_COLORS.wood);
          return;
        }
        if (type === 'parenting-card') {
          writePresentationCard(block.title || '곁에 두는 양육 카드', [
            { label: '멈출 말', text: block.stop || '' },
            { label: '시작할 말', text: block.start || '' },
            { label: '감정이 높을 때', text: block.steps || '' },
          ], COLORS.gold);
          return;
        }
        if (type === 'close') {
          writePresentationCard(block.title || '마무리', [{ text: block.text || '' }], COLORS.headerBg);
          return;
        }
        writePresentationCard(block.title || '참고', [{ text: block.text || '' }]);
      }

      function renderStructuredPresentation(presentation) {
        const cover = presentation.cover;
        // Cover has no report body: the first analytical content starts on page two.
        doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.headerBg);
        doc.font(fontBold).fontSize(30).fillColor(COLORS.gold)
          .text('SoMyung', MARGIN_L, 105, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(12).fillColor('#DDD4C8')
          .text(cover.kicker || '아이의 기질을 오늘의 양육 언어로', MARGIN_L, 158, { width: CONTENT_W, align: 'center' });
        doc.font(fontBold).fontSize(25).fillColor('#FFFFFF')
          .text(cover.title || labels.premiumReport, MARGIN_L, 248, { width: CONTENT_W, align: 'center', lineGap: 8 });
        doc.font(fontRegular).fontSize(12).fillColor('#DDD4C8')
          .text(cover.child || childName || '', MARGIN_L, 340, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(10).fillColor('#BFB7AD')
          .text(cover.date || `${labels.generatedOn}: ${reportDateLabel}`, MARGIN_L, 375, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(9).fillColor('#BFB7AD')
          .text('기질은 예측이 아니라, 아이를 이해하기 위한 참고 지도입니다.', MARGIN_L, 675, { width: CONTENT_W, align: 'center' });

        doc.addPage();
        doc.y = 82;
        doc.font(fontBold).fontSize(21).fillColor(COLORS.darkText)
          .text(presentation.opening.title || '부모를 위한 30초 요약', MARGIN_L, doc.y, { width: CONTENT_W });
        doc.moveDown(0.8);
        for (const item of presentation.opening.items || []) {
          writePresentationCard(item.title, [{ text: item.text }], item.accent || COLORS.gold);
        }
        if (presentation.opening.note) writeStructuredBlock({ type: 'note', text: presentation.opening.note });

        for (const section of presentation.sections) {
          if (section.startOnNewPage) {
            doc.addPage();
            doc.y = 68;
          } else {
            // The contract can explicitly keep a short final section with the
            // preceding card. It still moves to a new page if it cannot fit.
            ensureSpace(320);
            doc.moveDown(0.6);
          }
          doc.font(fontRegular).fontSize(10).fillColor(COLORS.gold)
            .text(`0${section.number}`, MARGIN_L, doc.y, { width: CONTENT_W });
          doc.font(fontBold).fontSize(20).fillColor(COLORS.darkText)
            .text(section.title, MARGIN_L, doc.y + 18, { width: CONTENT_W });
          doc.y += 56;
          for (const block of section.blocks) writeStructuredBlock(block);
        }
      }


      const presentation = aiInterpretation?.presentationStatus === 'ready'
        ? normalizePresentation(aiInterpretation.presentation)
        : null;
      if (presentation) {
        renderStructuredPresentation(presentation);
      } else {
      // ═════════════════════════════════════════════════════════════════
      // COVER PAGE
      // ═════════════════════════════════════════════════════════════════

      // Dark header band
      doc.rect(0, 0, PAGE_W, 160).fill(COLORS.headerBg);

      // Branding
      doc.font(fontBold).fontSize(28).fillColor(COLORS.gold);
      doc.text('SoMyung', MARGIN_L, 40, { width: CONTENT_W, align: 'center' });

      doc.font(fontRegular).fontSize(11).fillColor('#A09990');
      doc.text(labels.premiumReport, MARGIN_L, 75, { width: CONTENT_W, align: 'center' });

      // Child name
      doc.font(fontBold).fontSize(22).fillColor('#FFFFFF');
      doc.text(childName || '', MARGIN_L, 105, { width: CONTENT_W, align: 'center' });

      // Birth info below header band
      const infoY = 185;
      doc.font(fontRegular).fontSize(10).fillColor(COLORS.lightText);
      doc.text(`${labels.birthDate}: ${birthDate || '-'}`, MARGIN_L, infoY);
      doc.text(
        `${labels.gender}: ${gender === 'male' ? labels.male : labels.female}`,
        MARGIN_L, infoY + 18
      );
      doc.text(
        `${labels.generatedOn}: ${reportDateLabel}`,
        MARGIN_L, infoY + 36
      );

      doc.y = infoY + 65;


      // ═════════════════════════════════════════════════════════════════
      // FOUR PILLARS
      // ═════════════════════════════════════════════════════════════════
      const pillars = manseryeok?.pillars;
      if (pillars) {
        drawSectionHeader(labels.fourPillars);

        const pillarKeys = ['year', 'month', 'day', 'hour'];
        const pillarW = 110;
        const pillarH = 70;
        const gap = 10;
        const totalW = pillarW * 4 + gap * 3;
        const startX = MARGIN_L + (CONTENT_W - totalW) / 2;
        const py = doc.y;

        pillarKeys.forEach((key, i) => {
          const px = startX + i * (pillarW + gap);
          const pillarData = pillars[key];

          // Dark card background
          doc.roundedRect(px, py, pillarW, pillarH, 6).fill(COLORS.pillarBg);

          // Pillar label (gold)
          doc.font(fontRegular).fontSize(8).fillColor(COLORS.gold);
          doc.text(labels.pillars[i], px, py + 6, { width: pillarW, align: 'center' });

          // Pillar characters must always render as hanja, so use the CJK-capable font.
          const pillarChars = pillarData?.hanja || pillarData?.korean || '-';
          doc.font(pillarCardFont).fontSize(20).fillColor('#FFFFFF');
          doc.text(pillarChars, px, py + 22, { width: pillarW, align: 'center' });

          // Element label below — translate Korean element names for non-Korean PDFs
          let element = pillarData?.element || pillarData?.오행 || '';
          if (language && language !== 'ko' && element) {
            const elementMap = { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' };
            element = element.replace(/목|화|토|금|수/g, m => elementMap[m] || m);
          }
          if (element) {
            doc.font(fontRegular).fontSize(8).fillColor(COLORS.gold);
            doc.text(element, px, py + 50, { width: pillarW, align: 'center' });
          }
        });

        doc.y = py + pillarH + 20;
      }


      // ═════════════════════════════════════════════════════════════════
      // FIVE ELEMENTS BAR CHART
      // ═════════════════════════════════════════════════════════════════
      const elements = manseryeok?.elements;
      if (elements) {
        drawSectionHeader(labels.elementAnalysis);

        const elementKeys = ['wood', 'fire', 'earth', 'metal', 'water'];
        const elementColorList = [
          ELEMENT_COLORS.wood,
          ELEMENT_COLORS.fire,
          ELEMENT_COLORS.earth,
          ELEMENT_COLORS.metal,
          ELEMENT_COLORS.water,
        ];
        const total = elementKeys.reduce((sum, k) => sum + (elements[k] || 0), 0) || 1;

        const barStartX = MARGIN_L + 85;
        const barMaxW = 250;
        let ey = doc.y;

        elementKeys.forEach((key, i) => {
          const value = elements[key] || 0;
          const pct = Math.round((value / total) * 100);
          const barW = Math.max(8, (value / total) * barMaxW);

          // Element name
          doc.font(fontRegular).fontSize(9).fillColor(COLORS.bodyText);
          doc.text(labels.elements[i], MARGIN_L, ey + 2, { width: 80 });

          // Bar
          doc.roundedRect(barStartX, ey + 1, barW, 14, 3).fill(elementColorList[i]);

          // Count + percentage
          doc.font(fontRegular).fontSize(8).fillColor(COLORS.lightText);
          doc.text(`${value}  (${pct}%)`, barStartX + barMaxW + 10, ey + 3, { width: 70 });

          ey += 24;
        });

        doc.y = ey + 12;
      }


      // ═════════════════════════════════════════════════════════════════
      // AI REPORT SECTIONS
      // ═════════════════════════════════════════════════════════════════

      // Prefer fullText (preserves original section titles from AI)
      const fullText = aiInterpretation?.fullText || '';
      let sections = [];

      if (fullText) {
        const firstHeaderIndex = fullText.search(/^#{1,4}\s*\d+\.\s+/m);
        if (firstHeaderIndex > 0 && fullText.slice(0, firstHeaderIndex).trim()) {
          sections.push({ title: null, content: fullText.slice(0, firstHeaderIndex).trim() });
        }
        sections.push(...parseNumberedSections(fullText).map(({ title, content }) => ({ title, content })));
      }

      // Fallback to sections object if fullText parsing yields nothing
      if (sections.length === 0 && aiInterpretation?.sections) {
        const sectionMap = aiInterpretation.sections;
        const sectionOrder = [
          'executiveSummary', 'whatChildIsNot', 'behavioralSignature',
          'situationPlaybook', 'hiddenStrengths', 'timelineFocus',
          'sevenDayExperiment', 'coParentSummary', 'lifestyleHarmony',
        ];
        for (const key of sectionOrder) {
          if (sectionMap[key]) {
            sections.push({ title: key, content: sectionMap[key] });
          }
        }
      }

      // Render each section
      for (const section of sections) {
        if (section.title) {
          drawSectionHeader(section.title);
        } else {
          ensureSpace(30);
        }

        const blocks = parseMarkdown(section.content);

        for (const block of blocks) {
          switch (block.type) {
            case 'header':
              // Sub-header within a section
              ensureSpace(35);
              doc.font(fontBold).fontSize(11).fillColor(COLORS.darkText);
              doc.text(block.text, MARGIN_L, doc.y, { width: CONTENT_W });
              doc.moveDown(0.3);
              break;

            case 'text':
              ensureSpace(20);
              renderRichText(block.text, MARGIN_L, doc.y, {
                fontSize: 10,
                color: COLORS.bodyText,
                lineGap: 5,
              });
              doc.moveDown(0.15);
              break;

            case 'bullets':
              for (const item of block.items) {
                ensureSpace(18);
                // Prepend bullet to text and render as single block with indent
                renderRichText('\u2022  ' + item, MARGIN_L, doc.y, {
                  fontSize: 10,
                  color: COLORS.bodyText,
                  lineGap: 4,
                  indent: 8,
                });
              }
              doc.moveDown(0.2);
              break;

            case 'numbered':
              block.items.forEach((item) => {
                ensureSpace(18);
                const numLabel = typeof item === 'object' ? item.num : '?';
                const itemText = typeof item === 'object' ? item.text : item;
                renderRichText(`${numLabel}.  ` + itemText, MARGIN_L, doc.y, {
                  fontSize: 10,
                  color: COLORS.bodyText,
                  lineGap: 4,
                  indent: 8,
                });
              });
              doc.moveDown(0.2);
              break;

            case 'blank':
              doc.moveDown(0.4);
              break;
          }
        }

        // Extra space after each major section
        doc.moveDown(0.6);
      }
      }


      // ═════════════════════════════════════════════════════════════════
      // FOOTERS ON EVERY PAGE
      // ═════════════════════════════════════════════════════════════════
      // Snapshot page count BEFORE adding footers
      const contentPageCount = doc.bufferedPageRange().count;

      for (let i = 0; i < contentPageCount; i++) {
        doc.switchToPage(i);

        // Divider line
        doc.save();
        doc.moveTo(MARGIN_L, FOOTER_Y - 5)
          .lineTo(PAGE_W - MARGIN_R, FOOTER_Y - 5)
          .strokeColor(COLORS.divider)
          .lineWidth(0.5)
          .stroke();
        doc.restore();

        // Use low-level _fragment to avoid page creation side effects
        doc.font(fontRegular).fontSize(7).fillColor(COLORS.subtleText);
        const footerText = `☯ ${labels.footer}  |  ${i + 1} / ${contentPageCount}`;
        const textWidth = doc.widthOfString(footerText);
        const footerX = MARGIN_L + (CONTENT_W - textWidth) / 2;
        doc.text(footerText, footerX, FOOTER_Y + 2, { lineBreak: false });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateReportPDF,
  parseNumberedSections,
  normalizePresentation,
};
