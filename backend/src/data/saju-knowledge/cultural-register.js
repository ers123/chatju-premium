// 언어별 양육 화법 레지스터
//
// 왜 필요한가: 지식 베이스의 부모 대사는 한국어 문장이다. 그것을 번역하면
// 프랑스어 단어로 쓰인 한국식 육아 화법이 나온다. 측정 결과(2026-08-11,
// output/localization/) 비한국어 리포트는 주제는 살리지만 "문구 수준" 신호를
// 잃고 일반 육아 조언으로 후퇴했다 — 근거 보존율 ko 75% vs fr 50%.
//
// 그래서 각 언어에는 번역이 아니라 "같은 기능을 하는 그 나라 부모의 실제 말"이
// 필요하다. 아래는 그 말을 짓기 위한 최소한의 문화 좌표다.
//
// 원칙:
// - 고정관념이 아니라 '흔한 기본값'을 적는다. 개별 가정은 얼마든지 다르다.
// - 형식(라벨·섹션)을 강제하지 않는다. 그것은 상위 라벨 계약의 몫이다.
// - 짧게 유지한다. 프롬프트 예산을 먹으면 정작 원국 근거가 밀려난다.

const CULTURAL_REGISTER = {
  en: {
    label: 'English (US/UK family norms)',
    lines: [
      'Parents speak to children as individuals with opinions; choice-giving is the default lever ("Do you want A or B?").',
      'Praise names the effort and the specific behaviour, not the child\'s worth ("You kept going after it got hard").',
      'Emotion-labelling is mainstream and expected ("You sound frustrated").',
      'School context: homework routines, show-and-tell, playdates, report cards, extracurriculars.',
      'Avoid: shaming comparisons to siblings or classmates, and appeals to obedience for its own sake.',
    ],
  },
  ja: {
    label: 'Japanese',
    lines: [
      'Parents lean on shared routine and gentle framing rather than direct commands; 「〜しようね」「〜してみようか」 invites rather than orders.',
      'Consideration for those around the child (周りへの気配り) is a natural motivator and can be voiced without shaming.',
      'Praise is usually specific and understated; effusive praise reads as insincere.',
      'School context: 学校・園の準備, 給食, 係・当番, 習い事, 連絡帳.',
      'Avoid: blunt imperatives, public comparison, and over-familiar phrasing between parent and child.',
    ],
  },
  zh: {
    label: 'Chinese',
    lines: [
      'Parents are comfortable being directive, but warmth is shown through concrete care and involvement in the child\'s work.',
      'Effort and steady improvement are the culturally resonant frame ("比昨天多做了一点" lands better than raw talent talk).',
      'Family is a legitimate motivator, but keep it as belonging, never as debt or guilt.',
      'School context: 作业, 考试, 老师评价, 兴趣班, 同学关系.',
      'Avoid: framing that implies the child owes the parents, and comparisons with 别人家的孩子.',
    ],
  },
  vi: {
    label: 'Vietnamese',
    lines: [
      'Warm, close parent-child register; kinship terms (con, mẹ, ba) carry the affection and should appear naturally in quoted lines.',
      'Respect for elders and teachers is assumed; guidance framed as growing up well resonates.',
      'Encouragement is direct and affectionate; humour defuses tension effectively.',
      'School context: bài tập về nhà, cô giáo, lớp học thêm, bạn cùng lớp.',
      'Avoid: cold or clinical phrasing, and public criticism in front of relatives.',
    ],
  },
  id: {
    label: 'Indonesian',
    lines: [
      'Gentle, relational register; Bunda/Ayah and Nak/Kakak/Adik make quoted lines feel real.',
      'Politeness and not embarrassing others are strong values; correction works best in private and calmly.',
      'Religion and community are often part of family life — keep references light and optional, never assumed.',
      'School context: PR, guru, teman sekelas, kegiatan ekstrakurikuler, mengaji (optional).',
      'Avoid: harsh directness, and anything that would make the child lose face in front of others.',
    ],
  },
  es: {
    label: 'Spanish (Spain/Latin America)',
    lines: [
      'Expressive, physically warm register; diminutives and terms of endearment are normal in quoted lines.',
      'Family life is collective — mealtimes, extended family, and siblings are natural settings for examples.',
      'Direct emotional talk is comfortable; naming feelings out loud is not unusual.',
      'School context: deberes, la profe/el profe, el recreo, las notas, actividades extraescolares.',
      'Avoid: cold clinical wording, and rigid scheduling advice that ignores a later, more flexible family rhythm.',
    ],
  },
  pt: {
    label: 'Portuguese (Brazil/Portugal)',
    lines: [
      'Affectionate and informal register; warmth comes through directly in how parents address the child.',
      'Family and friendship networks matter; examples with cousins, neighbours and group play land well.',
      'Encouragement is enthusiastic and verbal; humour is a normal de-escalation tool.',
      'School context: lição de casa/trabalhos, a professora, o recreio, notas, atividades.',
      'Avoid: stiff formality, and advice that assumes a rigid single-household routine.',
    ],
  },
  fr: {
    label: 'French',
    lines: [
      'Parents explain the reason behind a rule; a short justification ("parce que…") is expected rather than bare authority.',
      'The register with children is affectionate but not gushing — measured warmth, and understatement over superlatives.',
      'Autonomy and self-control are valued early; framing a request as the child managing themselves works well.',
      'Mealtimes and conversation at the table are a real setting for family exchanges, and worth using in examples.',
      'School context: les devoirs, la maîtresse/le maître, la récré, le carnet de notes, le mercredi, les activités.',
      'Avoid: effusive praise stacked on every action, and imported ritual language that no French parent would say.',
    ],
  },
  th: {
    label: 'Thai',
    lines: [
      'Gentle, face-preserving register; keeping จิตใจ calm matters more than winning the exchange.',
      'Politeness particles (ครับ/ค่ะ, หนู for the child) make quoted lines sound real.',
      'Avoiding confrontation is culturally strong — correction works best softly, indirectly and in private.',
      'School context: การบ้าน, คุณครู, เพื่อนร่วมชั้น, กิจกรรมหลังเลิกเรียน.',
      'Avoid: raised-voice or confrontational scripts, and anything that shames the child publicly.',
    ],
  },
};

function getCulturalRegister(language) {
  return CULTURAL_REGISTER[language] || null;
}

module.exports = { CULTURAL_REGISTER, getCulturalRegister };
