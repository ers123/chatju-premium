const fs = require('fs');
const path = require('path');
const { generateReportPDF } = require('../src/services/pdf.service');

const sections = (language) => Array.from({ length: 9 }, (_, i) => `## ${i + 1}. ${language === 'ja' ? `観察セクション ${i + 1}` : `Professional observation section ${i + 1}`}\n\n${language === 'ja' ? '子どもの反応を急がず、観察できる小さな行動から対話を始めます。' : 'Supercalifragilisticexpialidocious observation language remains readable while the parent watches one small action and responds with a calm, concrete next step.'}`).join('\n\n');

async function main() {
  const dir = path.resolve(__dirname, '../../output/pdf');
  fs.mkdirSync(dir, { recursive: true });
  for (const [language, file] of [['en', 'somyung-premium-legacy-longword-en.pdf'], ['ja', 'somyung-premium-legacy-cjk-ja.pdf']]) {
    const pdf = await generateReportPDF({ childName: 'Fixture', birthDate: '2015-11-12', gender: 'female', language, generatedAt: '2026-07-22T00:00:00.000Z', manseryeok: {}, aiInterpretation: { fullText: sections(language), sections: {} , presentationStatus: 'fallback', presentationStatusReason: 'unsupported_locale' } });
    fs.writeFileSync(path.join(dir, file), pdf);
    console.log(path.join(dir, file));
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { sections };
