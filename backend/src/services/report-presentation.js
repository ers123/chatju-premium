// Premium report presentation boundary.
// The AI can continue returning Markdown, while intentional PDF layouts can
// opt into this small, validated structure without teaching the renderer to
// guess at arbitrary prose.

const REQUIRED_SECTION_NUMBERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const BLOCK_REQUIREMENTS = Object.freeze({
  text: ['title', 'text'],
  note: ['title', 'text'],
  insight: ['title', 'basis', 'behavior', 'action'],
  translator: ['title', 'looksLike', 'actual', 'response'],
  script: ['title', 'before', 'after', 'signal'],
  timeline: ['title', 'items'],
  checklist: ['title', 'items'],
  'parenting-card': ['title', 'stop', 'start', 'steps'],
  close: ['title', 'text'],
});

const ELEMENT_LABELS = Object.freeze({
  ko: { wood: '목', fire: '화', earth: '토', metal: '금', water: '수', prefix: '오행', basisPrefix: '산출 근거' },
  en: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water', prefix: 'Five Elements', basisPrefix: 'Calculated basis' },
  ja: { wood: '木', fire: '火', earth: '土', metal: '金', water: '水', prefix: '五行', basisPrefix: '算出根拠' },
  zh: { wood: '木', fire: '火', earth: '土', metal: '金', water: '水', prefix: '五行', basisPrefix: '计算依据' },
  vi: { wood: 'Mộc', fire: 'Hỏa', earth: 'Thổ', metal: 'Kim', water: 'Thủy', prefix: 'Ngũ hành', basisPrefix: 'Cơ sở tính toán' },
  id: { wood: 'Kayu', fire: 'Api', earth: 'Tanah', metal: 'Logam', water: 'Air', prefix: 'Lima Unsur', basisPrefix: 'Dasar perhitungan' },
  es: { wood: 'Madera', fire: 'Fuego', earth: 'Tierra', metal: 'Metal', water: 'Agua', prefix: 'Cinco Elementos', basisPrefix: 'Base calculada' },
  pt: { wood: 'Madeira', fire: 'Fogo', earth: 'Terra', metal: 'Metal', water: 'Água', prefix: 'Cinco Elementos', basisPrefix: 'Base calculada' },
  fr: { wood: 'Bois', fire: 'Feu', earth: 'Terre', metal: 'Métal', water: 'Eau', prefix: 'Cinq Éléments', basisPrefix: 'Base calculée' },
  th: { wood: 'ไม้', fire: 'ไฟ', earth: 'ดิน', metal: 'ทอง', water: 'น้ำ', prefix: 'ธาตุทั้งห้า', basisPrefix: 'ฐานการคำนวณ' },
});

const PRESENTATION_LOCALES = Object.freeze({
  ko: {
    languageName: 'Korean',
    cover: { kicker: 'SoMyung Premium', title: '아이의 속도를 읽는 양육 가이드' },
    opening: { title: '이번 리포트의 사용법', items: ['관찰', '대화', '실험'] },
    sectionTitles: ['아이 한눈에 보기', '이 아이는 ○○이 아닙니다', '아이의 행동 시그니처', '상황별 대응 플레이북', '숨겨진 강점', '이 시기의 흐름', '7일 양육 실험', '함께 읽는 양육 카드', '생활 속 밸런스 (참고 사항)'],
    ui: {
      compass: '30초 요약',
      basis: '계산된 근거',
      behavior: '관찰할 신호',
      action: '부모 행동',
      looksLike: '겉으로는',
      actual: '실제로는',
      response: '바꿀 말',
      before: '기존 말',
      after: '바꿀 말',
      signal: '좋아지는 신호',
      stop: '멈출 말',
      start: '시작할 말',
      steps: '감정이 높을 때',
    },
    labels: {
      s1: ['가장 흔한 오해', '가장 도움이 되는 것', '피해야 할 말', '효과적인 말', '이번 달 양육 포커스'],
      s2: ['오해', '실제', '더 나은 반응'],
      s3: ['관찰되는 행동', '내면의 논리', '악화 조건', '개선 조건'],
      s4: ['부모가 흔히 하는 말', '왜 역효과인지', '더 나은 스크립트', '개선 신호'],
      s5: ['약점으로 오해받는 상황', '이 강점이 빛나는 환경', '키워줄 활동 1가지', '진로 방향 힌트'],
      s6: ['압력 포인트', '주시할 행동 변화', '도움이 되는 것', '피해야 할 것'],
      s7: ['부모 행동 변화', '예상되는 아이 반응', '성공 신호'],
      s8: ['이 아이에게 기억할 5가지', '멈출 말 3가지', '시작할 말 3가지', '감정이 높아질 때 3단계'],
      s9: ['색상', '음식', '활동', '핵심 한 문장', '마무리'],
      s9OptionalSummary: ['요약', '한 줄 요약', '요약 한 문장', '요약(한 문장)', '이 리포트의 핵심 요약(한 문장)'],
    },
    generated: {
      focus: '이번 달 양육 포커스',
      scene: (index) => `오해를 푸는 장면 ${index + 1}`,
      signature: (index) => `행동 시그니처 ${index + 1}`,
      inferencePrefix: '추론',
      script: (index) => `대화 스크립트 ${index + 1}`,
      referencePrefix: '참고',
      careerHint: '진로 방향 힌트',
      flow: '이번 시기의 참고 흐름',
      avoid: '피해야 할 것',
      readingMethod: '읽는 방법',
      readingMethodText: '미래를 확정하는 예언이 아니라 관찰을 위한 참고선입니다.',
      smallExperiment: '작은 실험',
      reaction: '반응',
      success: '성공',
      day: (index) => `${index + 1}일`,
      remember: '기억할 말',
      card: '곁에 두는 양육 카드',
      ideas: '선택적 참고 아이디어',
      close: '방법과 한계',
    },
  },
  en: {
    languageName: 'English',
    cover: { kicker: 'SoMyung Premium', title: "A Parenting Guide to Your Child's Pace" },
    opening: { title: 'How to Use This Report', items: ['Observe', 'Talk', 'Experiment'] },
    sectionTitles: ['At a Glance', 'This Child Is NOT...', 'Behavioral Signatures', 'Situational Playbook', 'Hidden Strengths', 'The Current Flow', '7-Day Parenting Experiment', 'Parenting Card to Share', 'Everyday Balance (reference)'],
    ui: { compass: '30 second compass', basis: 'Calculated basis', behavior: 'Signal to observe', action: 'Parent action', looksLike: 'Looks like', actual: 'Actually', response: 'Better wording', before: 'Old wording', after: 'Better wording', signal: 'Improvement signal', stop: 'Words to stop', start: 'Words to start', steps: 'When emotions rise' },
    labels: {
      s1: ['Most common misunderstanding', 'What helps most', 'Words to avoid', 'Effective words', 'Parenting focus this month'],
      s2: ['Misunderstanding', 'Reality', 'Better response'],
      s3: ['Observed behavior', 'Inner logic', 'Worsening condition', 'Improving condition'],
      s4: ['What parents often say', 'Why it backfires', 'Better script', 'Improvement signal'],
      s5: ['When it is mistaken for a weakness', 'Where this strength shines', 'One activity to grow it', 'Career direction hint'],
      s6: ['Pressure point', 'Behavior change to watch', 'What helps', 'What to avoid'],
      s7: ['Parent behavior change', 'Expected child response', 'Success signal'],
      s8: ['5 things to remember about this child', '3 words to stop', '3 words to start', '3 steps when emotions rise'],
      s9: ['Color', 'Food', 'Activity', 'Core sentence', 'Closing'],
      s9OptionalSummary: ['Summary', 'One-line summary', 'Core summary sentence'],
    },
    generated: { focus: 'Parenting focus this month', scene: (i) => `Misunderstanding scene ${i + 1}`, signature: (i) => `Behavioral signature ${i + 1}`, inferencePrefix: 'Inference', script: (i) => `Conversation script ${i + 1}`, referencePrefix: 'Reference', careerHint: 'Career direction hint', flow: 'Reference flow for this period', avoid: 'What to avoid', readingMethod: 'How to read this', readingMethodText: 'This is not a prediction that fixes the future; it is a reference line for observation.', smallExperiment: 'Small experiment', reaction: 'Response', success: 'Success', day: (i) => `Day ${i + 1}`, remember: 'Words to remember', card: 'Parenting card to keep nearby', ideas: 'Optional reference ideas', close: 'Method and limits' },
  },
  ja: {
    languageName: 'Japanese',
    cover: { kicker: 'SoMyung Premium', title: '子どものペースを読む子育てガイド' },
    opening: { title: 'このレポートの使い方', items: ['観察', '対話', '実験'] },
    sectionTitles: ['この子をひと目で', 'この子は○○ではありません', 'この子の行動シグネチャー', '場面別の対応プレイブック', '隠れた強み', '今の時期の流れ', '7日間の子育て実験', 'いっしょに読む子育てカード', '暮らしの中のバランス（参考）'],
    ui: { compass: '30秒サマリー', basis: '算出された根拠', behavior: '観察するサイン', action: '親の行動', looksLike: '表面上は', actual: '実際には', response: '言い換える言葉', before: 'これまでの言葉', after: '言い換える言葉', signal: '改善のサイン', stop: 'やめる言葉', start: '始める言葉', steps: '感情が高まる時' },
    labels: {
      s1: ['最もよくある誤解', '最も助けになること', '避ける言葉', '効果的な言葉', '今月の子育てフォーカス'],
      s2: ['誤解', '実際', 'よりよい反応'],
      s3: ['観察される行動', '内側の論理', '悪化する条件', '改善する条件'],
      s4: ['親がよく言う言葉', '逆効果になる理由', 'よりよいスクリプト', '改善のサイン'],
      s5: ['弱点と誤解される場面', 'この強みが光る環境', '育てる活動1つ', '進路方向のヒント'],
      s6: ['圧力ポイント', '注視する行動変化', '助けになること', '避けること'],
      s7: ['親の行動変化', '予想される子どもの反応', '成功のサイン'],
      s8: ['この子について覚えておきたい5つ', 'やめる言葉3つ', '始める言葉3つ', '感情が高まる時の3段階'],
      s9: ['色', '食べ物', '活動', '核心の一文', '締めくくり'],
      s9OptionalSummary: ['要約', '一行要約', '核心要約文'],
    },
    generated: { focus: '今月の子育てフォーカス', scene: (i) => `誤解をほどく場面 ${i + 1}`, signature: (i) => `行動シグネチャー ${i + 1}`, inferencePrefix: '推論', script: (i) => `対話スクリプト ${i + 1}`, referencePrefix: '参考', careerHint: '進路方向のヒント', flow: 'この時期の参考フロー', avoid: '避けること', readingMethod: '読み方', readingMethodText: '未来を確定する予言ではなく、観察のための参考線です。', smallExperiment: '小さな実験', reaction: '反応', success: '成功', day: (i) => `${i + 1}日目`, remember: '覚えておく言葉', card: 'そばに置く子育てカード', ideas: '任意の参考アイデア', close: '方法と限界' },
  },
  zh: {
    languageName: 'Chinese',
    cover: { kicker: 'SoMyung Premium', title: '读懂孩子节奏的养育指南' },
    opening: { title: '如何使用这份报告', items: ['观察', '对话', '实验'] },
    sectionTitles: ['一眼看懂孩子', '这个孩子不是○○', '孩子的行为特征', '情境应对手册', '隐藏的优势', '这个时期的流向', '7天养育实验', '一起阅读的养育卡片', '生活中的平衡（参考）'],
    ui: { compass: '30秒摘要', basis: '计算依据', behavior: '可观察信号', action: '父母行动', looksLike: '表面看起来', actual: '实际上', response: '更好的说法', before: '原来的话', after: '更好的说法', signal: '改善信号', stop: '停止说的话', start: '开始说的话', steps: '情绪升高时' },
    labels: {
      s1: ['最常见的误解', '最有帮助的事', '应避免的话', '有效的话', '本月养育重点'],
      s2: ['误解', '实际', '更好的回应'],
      s3: ['观察到的行为', '内在逻辑', '恶化条件', '改善条件'],
      s4: ['父母常说的话', '为什么会适得其反', '更好的脚本', '改善信号'],
      s5: ['被误认为弱点的情况', '这个优势发光的环境', '培养它的一个活动', '职业方向提示'],
      s6: ['压力点', '需要关注的行为变化', '有帮助的事', '应避免的事'],
      s7: ['父母行为变化', '预期的孩子反应', '成功信号'],
      s8: ['关于这个孩子要记住的5件事', '停止说的3句话', '开始说的3句话', '情绪升高时的3个步骤'],
      s9: ['颜色', '食物', '活动', '核心一句话', '结语'],
      s9OptionalSummary: ['摘要', '一句话摘要', '核心摘要句'],
    },
    generated: { focus: '本月养育重点', scene: (i) => `解开误解的场景 ${i + 1}`, signature: (i) => `行为特征 ${i + 1}`, inferencePrefix: '推论', script: (i) => `对话脚本 ${i + 1}`, referencePrefix: '参考', careerHint: '职业方向提示', flow: '这个时期的参考流程', avoid: '应避免的事', readingMethod: '阅读方式', readingMethodText: '这不是确定未来的预言，而是用于观察的参考线。', smallExperiment: '小实验', reaction: '反应', success: '成功', day: (i) => `第${i + 1}天`, remember: '要记住的话', card: '放在身边的养育卡片', ideas: '可选参考想法', close: '方法与限制' },
  },
});

const LATIN_LOCALE_OVERRIDES = Object.freeze({
  vi: {
    languageName: 'Vietnamese',
    cover: { title: 'Hướng dẫn nuôi dạy theo nhịp độ của trẻ' },
    opening: { title: 'Cách dùng báo cáo này', items: ['Quan sát', 'Trò chuyện', 'Thử nghiệm'] },
    sectionTitles: ['Nhìn nhanh về con', 'Con bạn KHÔNG phải là...', 'Dấu ấn hành vi của trẻ', 'Kịch bản ứng xử theo tình huống', 'Điểm mạnh tiềm ẩn', 'Dòng chảy giai đoạn này', 'Thử nghiệm nuôi dạy 7 ngày', 'Thẻ nuôi dạy cùng đọc', 'Cân bằng trong đời sống (tham khảo)'],
    ui: { compass: 'Tóm tắt 30 giây', basis: 'Cơ sở tính toán', behavior: 'Tín hiệu cần quan sát', action: 'Hành động của cha mẹ', looksLike: 'Bề ngoài', actual: 'Thực ra', response: 'Cách nói tốt hơn', before: 'Cách nói cũ', after: 'Cách nói tốt hơn', signal: 'Dấu hiệu cải thiện', stop: 'Lời nên dừng', start: 'Lời nên bắt đầu', steps: 'Khi cảm xúc tăng cao' },
    generated: { focus: 'Trọng tâm nuôi dạy tháng này', scene: (i) => `Tình huống hiểu lầm ${i + 1}`, signature: (i) => `Dấu ấn hành vi ${i + 1}`, inferencePrefix: 'Suy luận', script: (i) => `Kịch bản trò chuyện ${i + 1}`, referencePrefix: 'Tham khảo', careerHint: 'Gợi ý hướng nghề nghiệp', flow: 'Dòng tham khảo giai đoạn này', avoid: 'Điều nên tránh', readingMethod: 'Cách đọc', readingMethodText: 'Đây không phải là dự đoán cố định tương lai, mà là đường tham khảo để quan sát.', smallExperiment: 'Thử nghiệm nhỏ', reaction: 'Phản ứng', success: 'Thành công', day: (i) => `Ngày ${i + 1}`, remember: 'Lời cần nhớ', card: 'Thẻ nuôi dạy để giữ bên cạnh', ideas: 'Gợi ý tham khảo tùy chọn', close: 'Phương pháp và giới hạn' },
  },
  id: {
    languageName: 'Indonesian',
    cover: { title: 'Panduan Membaca Ritme Anak' },
    opening: { title: 'Cara Menggunakan Laporan Ini', items: ['Amati', 'Bicarakan', 'Coba'] },
    sectionTitles: ['Sekilas tentang Anak', 'Anak Ini BUKAN...', 'Tanda Khas Perilaku Anak', 'Panduan Respons per Situasi', 'Kekuatan Tersembunyi', 'Arus Periode Ini', 'Eksperimen Pengasuhan 7 Hari', 'Kartu Pengasuhan untuk Dibaca Bersama', 'Keseimbangan Sehari-hari (referensi)'],
    ui: { compass: 'Ringkasan 30 detik', basis: 'Dasar perhitungan', behavior: 'Sinyal yang diamati', action: 'Tindakan orang tua', looksLike: 'Terlihat seperti', actual: 'Sebenarnya', response: 'Ucapan yang lebih baik', before: 'Ucapan lama', after: 'Ucapan yang lebih baik', signal: 'Tanda membaik', stop: 'Kata yang dihentikan', start: 'Kata yang dimulai', steps: 'Saat emosi naik' },
    generated: { focus: 'Fokus pengasuhan bulan ini', scene: (i) => `Adegan salah paham ${i + 1}`, signature: (i) => `Tanda khas perilaku ${i + 1}`, inferencePrefix: 'Perkiraan', script: (i) => `Skrip percakapan ${i + 1}`, referencePrefix: 'Referensi', careerHint: 'Petunjuk arah karier', flow: 'Alur referensi periode ini', avoid: 'Yang perlu dihindari', readingMethod: 'Cara membaca', readingMethodText: 'Ini bukan ramalan yang menetapkan masa depan, melainkan garis referensi untuk observasi.', smallExperiment: 'Eksperimen kecil', reaction: 'Respons', success: 'Keberhasilan', day: (i) => `Hari ${i + 1}`, remember: 'Kata untuk diingat', card: 'Kartu pengasuhan untuk disimpan', ideas: 'Ide referensi opsional', close: 'Metode dan batasan' },
  },
  es: {
    languageName: 'Spanish',
    cover: { title: 'Guía para leer el ritmo de tu hijo' },
    opening: { title: 'Cómo usar este informe', items: ['Observar', 'Conversar', 'Experimentar'] },
    sectionTitles: ['Tu hijo de un vistazo', 'Tu hijo NO es...', 'Sus patrones de conducta', 'Guía práctica por situación', 'Fortalezas ocultas', 'La corriente de esta etapa', 'Experimento de crianza de 7 días', 'Tarjeta de crianza para compartir', 'Equilibrio cotidiano (referencia)'],
    ui: { compass: 'Resumen de 30 segundos', basis: 'Base calculada', behavior: 'Señal a observar', action: 'Acción de los padres', looksLike: 'Parece', actual: 'En realidad', response: 'Mejor frase', before: 'Frase anterior', after: 'Mejor frase', signal: 'Señal de mejora', stop: 'Frases a detener', start: 'Frases a iniciar', steps: 'Cuando sube la emoción' },
    generated: { focus: 'Foco de crianza de este mes', scene: (i) => `Escena de malentendido ${i + 1}`, signature: (i) => `Patrón de conducta ${i + 1}`, inferencePrefix: 'Inferencia', script: (i) => `Guion de conversación ${i + 1}`, referencePrefix: 'Referencia', careerHint: 'Pista de orientación profesional', flow: 'Flujo de referencia de este periodo', avoid: 'Lo que conviene evitar', readingMethod: 'Cómo leerlo', readingMethodText: 'No es una predicción que fija el futuro, sino una línea de referencia para observar.', smallExperiment: 'Pequeño experimento', reaction: 'Respuesta', success: 'Éxito', day: (i) => `Día ${i + 1}`, remember: 'Frases para recordar', card: 'Tarjeta de crianza para tener cerca', ideas: 'Ideas opcionales de referencia', close: 'Método y límites' },
  },
  pt: {
    languageName: 'Portuguese',
    cover: { title: 'Guia para ler o ritmo da criança' },
    opening: { title: 'Como usar este relatório', items: ['Observar', 'Conversar', 'Experimentar'] },
    sectionTitles: ['A criança num relance', 'Esta criança NÃO é...', 'Padrões de comportamento', 'Guia prático por situação', 'Forças escondidas', 'A corrente desta fase', 'Experimento parental de 7 dias', 'Cartão parental para compartilhar', 'Equilíbrio do dia a dia (referência)'],
    ui: { compass: 'Resumo de 30 segundos', basis: 'Base calculada', behavior: 'Sinal a observar', action: 'Ação dos pais', looksLike: 'Parece', actual: 'Na prática', response: 'Melhor fala', before: 'Fala antiga', after: 'Melhor fala', signal: 'Sinal de melhora', stop: 'Falas a parar', start: 'Falas a começar', steps: 'Quando a emoção sobe' },
    generated: { focus: 'Foco parental deste mês', scene: (i) => `Cena de mal-entendido ${i + 1}`, signature: (i) => `Padrão de comportamento ${i + 1}`, inferencePrefix: 'Inferência', script: (i) => `Roteiro de conversa ${i + 1}`, referencePrefix: 'Referência', careerHint: 'Pista de direção profissional', flow: 'Fluxo de referência deste período', avoid: 'O que evitar', readingMethod: 'Como ler', readingMethodText: 'Isto não é uma previsão que fixa o futuro, mas uma linha de referência para observação.', smallExperiment: 'Pequeno experimento', reaction: 'Resposta', success: 'Sucesso', day: (i) => `Dia ${i + 1}`, remember: 'Frases para lembrar', card: 'Cartão parental para manter por perto', ideas: 'Ideias opcionais de referência', close: 'Método e limites' },
  },
  fr: {
    languageName: 'French',
    cover: { title: "Guide pour lire le rythme de l'enfant" },
    opening: { title: 'Comment utiliser ce rapport', items: ['Observer', 'Parler', 'Expérimenter'] },
    sectionTitles: ["L'enfant en un coup d'œil", "Cet enfant n'est PAS...", 'Signatures de comportement', 'Scénarios selon la situation', 'Forces cachées', 'Le courant de cette période', 'Expérience parentale de 7 jours', 'Carte parentale à partager', 'Équilibre au quotidien (à titre indicatif)'],
    ui: { compass: 'Résumé en 30 secondes', basis: 'Base calculée', behavior: 'Signal à observer', action: 'Action parentale', looksLike: 'En apparence', actual: 'En réalité', response: 'Meilleure formulation', before: 'Ancienne phrase', after: 'Meilleure formulation', signal: "Signal d'amélioration", stop: 'Phrases à arrêter', start: 'Phrases à commencer', steps: "Quand l'émotion monte" },
    generated: { focus: 'Priorité parentale du mois', scene: (i) => `Scène de malentendu ${i + 1}`, signature: (i) => `Signature de comportement ${i + 1}`, inferencePrefix: 'Déduction', script: (i) => `Script de conversation ${i + 1}`, referencePrefix: 'Repère', careerHint: "Indice d'orientation professionnelle", flow: 'Repère pour cette période', avoid: "Ce qu'il faut éviter", readingMethod: 'Comment le lire', readingMethodText: "Ce n'est pas une prédiction qui fixe l'avenir, mais un repère d'observation.", smallExperiment: 'Petite expérience', reaction: 'Réaction', success: 'Réussite', day: (i) => `Jour ${i + 1}`, remember: 'Phrases à retenir', card: 'Carte parentale à garder près de soi', ideas: 'Idées de référence optionnelles', close: 'Méthode et limites' },
  },
  th: {
    languageName: 'Thai',
    cover: { title: 'คู่มืออ่านจังหวะของลูก' },
    opening: { title: 'วิธีใช้รายงานนี้', items: ['สังเกต', 'พูดคุย', 'ทดลอง'] },
    sectionTitles: ['มองลูกในภาพรวม', 'ลูกของคุณไม่ใช่○○', 'สัญญาณพฤติกรรมของลูก', 'คู่มือรับมือตามสถานการณ์', 'จุดแข็งที่ซ่อนอยู่', 'กระแสของช่วงเวลานี้', 'การทดลองเลี้ยงดู 7 วัน', 'การ์ดเลี้ยงดูที่อ่านด้วยกัน', 'สมดุลในชีวิตประจำวัน (ข้อมูลอ้างอิง)'],
    ui: { compass: 'สรุป 30 วินาที', basis: 'ฐานการคำนวณ', behavior: 'สัญญาณที่ควรสังเกต', action: 'การกระทำของพ่อแม่', looksLike: 'ดูเหมือนว่า', actual: 'จริง ๆ แล้ว', response: 'คำพูดที่ดีกว่า', before: 'คำพูดเดิม', after: 'คำพูดที่ดีกว่า', signal: 'สัญญาณที่ดีขึ้น', stop: 'คำพูดที่ควรหยุด', start: 'คำพูดที่ควรเริ่ม', steps: 'เมื่ออารมณ์สูงขึ้น' },
    generated: { focus: 'จุดเน้นการเลี้ยงดูเดือนนี้', scene: (i) => `ฉากคลี่คลายความเข้าใจผิด ${i + 1}`, signature: (i) => `สัญญาณพฤติกรรม ${i + 1}`, inferencePrefix: 'การอนุมาน', script: (i) => `บทสนทนา ${i + 1}`, referencePrefix: 'อ้างอิง', careerHint: 'คำใบ้ทิศทางอาชีพ', flow: 'แนวโน้มอ้างอิงช่วงนี้', avoid: 'สิ่งที่ควรหลีกเลี่ยง', readingMethod: 'วิธีอ่าน', readingMethodText: 'นี่ไม่ใช่คำทำนายที่กำหนดอนาคต แต่เป็นแนวอ้างอิงสำหรับการสังเกต', smallExperiment: 'การทดลองเล็ก ๆ', reaction: 'ปฏิกิริยา', success: 'ความสำเร็จ', day: (i) => `วันที่ ${i + 1}`, remember: 'คำที่ควรจำ', card: 'การ์ดเลี้ยงดูที่เก็บไว้ใกล้ตัว', ideas: 'ไอเดียอ้างอิงเสริม', close: 'วิธีการและข้อจำกัด' },
  },
});

const LATIN_LABELS = Object.freeze({
  vi: {
    s1: ['Hiểu lầm thường gặp nhất', 'Điều giúp ích nhất', 'Lời nên tránh', 'Lời hiệu quả', 'Trọng tâm nuôi dạy tháng này'],
    s2: ['Hiểu lầm', 'Thực tế', 'Phản ứng tốt hơn'],
    s3: ['Hành vi quan sát được', 'Logic bên trong', 'Điều kiện làm xấu đi', 'Điều kiện cải thiện'],
    s4: ['Cha mẹ thường nói', 'Vì sao phản tác dụng', 'Kịch bản tốt hơn', 'Dấu hiệu cải thiện'],
    s5: ['Tình huống bị hiểu nhầm là điểm yếu', 'Môi trường nơi điểm mạnh này tỏa sáng', 'Một hoạt động để nuôi dưỡng', 'Gợi ý hướng nghề nghiệp'],
    s6: ['Điểm áp lực', 'Thay đổi hành vi cần theo dõi', 'Điều giúp ích', 'Điều nên tránh'],
    s7: ['Thay đổi hành vi của cha mẹ', 'Phản ứng dự kiến của trẻ', 'Dấu hiệu thành công'],
    s8: ['5 điều cần nhớ về trẻ này', '3 lời nên dừng', '3 lời nên bắt đầu', '3 bước khi cảm xúc tăng cao'],
    s9: ['Màu sắc', 'Thức ăn', 'Hoạt động', 'Câu cốt lõi', 'Lời kết'],
  },
  id: {
    s1: ['Kesalahpahaman paling umum', 'Hal yang paling membantu', 'Kata yang perlu dihindari', 'Kata yang efektif', 'Fokus pengasuhan bulan ini'],
    s2: ['Kesalahpahaman', 'Kenyataan', 'Respons yang lebih baik'],
    s3: ['Perilaku yang terlihat', 'Logika batin', 'Kondisi yang memperburuk', 'Kondisi yang memperbaiki'],
    s4: ['Yang sering dikatakan orang tua', 'Mengapa berbalik merugikan', 'Skrip yang lebih baik', 'Tanda perbaikan'],
    s5: ['Situasi saat disalahpahami sebagai kelemahan', 'Lingkungan tempat kekuatan ini bersinar', 'Satu aktivitas untuk menumbuhkannya', 'Petunjuk arah karier'],
    s6: ['Titik tekanan', 'Perubahan perilaku yang perlu diamati', 'Yang membantu', 'Yang perlu dihindari'],
    s7: ['Perubahan perilaku orang tua', 'Respons anak yang diperkirakan', 'Tanda keberhasilan'],
    s8: ['5 hal yang perlu diingat tentang anak ini', '3 kata yang perlu dihentikan', '3 kata yang perlu dimulai', '3 langkah saat emosi naik'],
    s9: ['Warna', 'Makanan', 'Aktivitas', 'Kalimat inti', 'Penutup'],
  },
  es: {
    s1: ['Malentendido más común', 'Lo que más ayuda', 'Palabras a evitar', 'Palabras efectivas', 'Foco de crianza de este mes'],
    s2: ['Malentendido', 'Realidad', 'Mejor respuesta'],
    s3: ['Conducta observada', 'Lógica interna', 'Condición que empeora', 'Condición que mejora'],
    s4: ['Lo que los padres suelen decir', 'Por qué resulta contraproducente', 'Mejor guion', 'Señal de mejora'],
    s5: ['Situación en que se confunde con una debilidad', 'Entorno donde esta fortaleza brilla', 'Una actividad para cultivarla', 'Pista de orientación profesional'],
    s6: ['Punto de presión', 'Cambio de conducta a observar', 'Lo que ayuda', 'Lo que conviene evitar'],
    s7: ['Cambio de conducta de los padres', 'Respuesta esperada del niño', 'Señal de éxito'],
    s8: ['5 cosas para recordar sobre este niño', '3 frases que conviene detener', '3 frases que conviene empezar', '3 pasos cuando sube la emoción'],
    s9: ['Color', 'Comida', 'Actividad', 'Frase central', 'Cierre'],
  },
  pt: {
    s1: ['Mal-entendido mais comum', 'O que mais ajuda', 'Palavras a evitar', 'Palavras eficazes', 'Foco parental deste mês'],
    s2: ['Mal-entendido', 'Realidade', 'Melhor resposta'],
    s3: ['Comportamento observado', 'Lógica interna', 'Condição que piora', 'Condição que melhora'],
    s4: ['O que os pais costumam dizer', 'Por que tem efeito contrário', 'Roteiro melhor', 'Sinal de melhora'],
    s5: ['Situação em que é confundido com fraqueza', 'Ambiente onde essa força aparece', 'Uma atividade para desenvolver', 'Pista de direção profissional'],
    s6: ['Ponto de pressão', 'Mudança de comportamento a observar', 'O que ajuda', 'O que evitar'],
    s7: ['Mudança de comportamento dos pais', 'Resposta esperada da criança', 'Sinal de sucesso'],
    s8: ['5 coisas para lembrar sobre esta criança', '3 falas a parar', '3 falas a começar', '3 passos quando a emoção sobe'],
    s9: ['Cor', 'Comida', 'Atividade', 'Frase central', 'Encerramento'],
  },
  fr: {
    s1: ['Malentendu le plus courant', 'Ce qui aide le plus', 'Mots à éviter', 'Mots efficaces', 'Priorité parentale du mois'],
    s2: ['Malentendu', 'Réalité', 'Meilleure réponse'],
    s3: ['Comportement observé', 'Logique intérieure', 'Condition qui aggrave', 'Condition qui améliore'],
    s4: ['Ce que les parents disent souvent', 'Pourquoi cela se retourne contre eux', 'Meilleur script', "Signal d'amélioration"],
    s5: ['Situation où cela est pris pour une faiblesse', 'Environnement où cette force apparaît', 'Une activité pour la développer', "Indice d'orientation professionnelle"],
    s6: ['Point de pression', 'Changement de comportement à surveiller', 'Ce qui aide', 'Ce qu’il faut éviter'],
    s7: ['Changement de comportement parental', "Réponse attendue de l'enfant", 'Signal de réussite'],
    s8: ['5 choses à retenir sur cet enfant', '3 phrases à arrêter', '3 phrases à commencer', "3 étapes quand l'émotion monte"],
    s9: ['Couleur', 'Nourriture', 'Activité', 'Phrase centrale', 'Clôture'],
  },
  th: {
    s1: ['ความเข้าใจผิดที่พบบ่อยที่สุด', 'สิ่งที่ช่วยได้มากที่สุด', 'คำพูดที่ควรหลีกเลี่ยง', 'คำพูดที่ได้ผล', 'จุดเน้นการเลี้ยงดูเดือนนี้'],
    s2: ['ความเข้าใจผิด', 'ความจริง', 'การตอบสนองที่ดีกว่า'],
    s3: ['พฤติกรรมที่สังเกตได้', 'ตรรกะภายใน', 'เงื่อนไขที่ทำให้แย่ลง', 'เงื่อนไขที่ทำให้ดีขึ้น'],
    s4: ['สิ่งที่พ่อแม่มักพูด', 'ทำไมจึงย้อนผล', 'สคริปต์ที่ดีกว่า', 'สัญญาณที่ดีขึ้น'],
    s5: ['สถานการณ์ที่ถูกเข้าใจผิดว่าเป็นจุดอ่อน', 'สภาพแวดล้อมที่จุดแข็งนี้เปล่งประกาย', 'กิจกรรมหนึ่งอย่างเพื่อบ่มเพาะ', 'คำใบ้ทิศทางอาชีพ'],
    s6: ['จุดกดดัน', 'การเปลี่ยนแปลงพฤติกรรมที่ควรดู', 'สิ่งที่ช่วยได้', 'สิ่งที่ควรหลีกเลี่ยง'],
    s7: ['การเปลี่ยนพฤติกรรมของพ่อแม่', 'ปฏิกิริยาที่คาดจากลูก', 'สัญญาณความสำเร็จ'],
    s8: ['5 สิ่งที่ควรจำเกี่ยวกับเด็กคนนี้', '3 คำพูดที่ควรหยุด', '3 คำพูดที่ควรเริ่ม', '3 ขั้นตอนเมื่ออารมณ์สูงขึ้น'],
    s9: ['สี', 'อาหาร', 'กิจกรรม', 'ประโยคหลัก', 'ปิดท้าย'],
  },
});

function buildLocale(language = 'ko') {
  const base = PRESENTATION_LOCALES[language] || PRESENTATION_LOCALES.en;
  const latinOverride = LATIN_LOCALE_OVERRIDES[language] || {};
  const labels = LATIN_LABELS[language] || base.labels;
  const fallback = PRESENTATION_LOCALES.en;
  return {
    ...fallback,
    ...base,
    ...latinOverride,
    cover: { ...fallback.cover, ...base.cover, ...(latinOverride.cover || {}) },
    opening: { ...fallback.opening, ...base.opening, ...(latinOverride.opening || {}) },
    ui: { ...fallback.ui, ...base.ui, ...(latinOverride.ui || {}) },
    labels: { ...fallback.labels, ...labels, s9OptionalSummary: labels.s9OptionalSummary || base.labels?.s9OptionalSummary || fallback.labels.s9OptionalSummary },
    generated: { ...fallback.generated, ...base.generated, ...(latinOverride.generated || {}) },
  };
}

function getPremiumPresentationLocale(language = 'ko') {
  return buildLocale(language);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireString(value, path) {
  if (!isNonEmptyString(value)) throw new Error(`Premium presentation requires non-empty ${path}.`);
}

function validateItems(items, path) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Premium presentation requires non-empty ${path}.`);
  }
  items.forEach((item, index) => {
    requireString(item?.label, `${path}[${index}].label`);
    requireString(item?.text, `${path}[${index}].text`);
  });
}

function validateBlock(block, path) {
  if (!block || typeof block !== 'object') throw new Error(`Premium presentation requires ${path}.`);
  if (!Object.prototype.hasOwnProperty.call(BLOCK_REQUIREMENTS, block.type)) {
    throw new Error(`Premium presentation does not support ${path}.type: ${String(block.type)}.`);
  }
  BLOCK_REQUIREMENTS[block.type].forEach((field) => {
    if (field === 'items') validateItems(block.items, `${path}.items`);
    else requireString(block[field], `${path}.${field}`);
  });
}

function validateCoverAndOpening(presentation) {
  const { cover, opening } = presentation;
  if (!cover || typeof cover !== 'object') throw new Error('Premium presentation requires cover.');
  ['kicker', 'title', 'child', 'date'].forEach((field) => requireString(cover[field], `cover.${field}`));

  if (!opening || typeof opening !== 'object') throw new Error('Premium presentation requires opening.');
  requireString(opening.title, 'opening.title');
  if (!Array.isArray(opening.items) || opening.items.length === 0) {
    throw new Error('Premium presentation requires non-empty opening.items.');
  }
  requireString(opening.note, 'opening.note');
  opening.items.forEach((item, index) => {
    requireString(item?.title, `opening.items[${index}].title`);
    requireString(item?.text, `opening.items[${index}].text`);
    if (item.accent !== undefined && !isNonEmptyString(item.accent)) {
      throw new Error(`Premium presentation requires non-empty opening.items[${index}].accent when supplied.`);
    }
  });
}

function parseNumberedSections(fullText) {
  if (!fullText || !fullText.trim()) return [];

  const matches = [...fullText.matchAll(/^#{1,4}\s*(\d+)\.\s*(.+?)\s*$/gm)];
  return matches.map((match, index) => {
    const contentStart = match.index + match[0].length;
    const contentEnd = index + 1 < matches.length ? matches[index + 1].index : fullText.length;
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      // The heading is deliberately excluded: it is drawn exactly once by the PDF renderer.
      content: fullText.slice(contentStart, contentEnd).trim(),
    };
  });
}

function normalizePresentation(presentation) {
  if (!presentation || !Array.isArray(presentation.sections)) return null;

  validateCoverAndOpening(presentation);

  // Section titles are not taken from the model: it does not honour the "write the
  // headings in the report language" instruction and leaks English into every
  // non-English report. The locale bundle owns them, and sections are validated
  // just below to be exactly 1..9 in order, so index i is section i + 1. The
  // model's title is only a fallback for a locale that has no title at that index.
  const localeSectionTitles = (presentation.locale && getPremiumPresentationLocale(presentation.locale).sectionTitles) || [];
  const sections = presentation.sections.map((section, index) => ({
    number: Number(section.number),
    title: String(localeSectionTitles[index] || section.title || '').trim(),
    blocks: Array.isArray(section.blocks) ? section.blocks : [],
    startOnNewPage: section.startOnNewPage !== false,
  }));
  const numbers = sections.map((section) => section.number);
  const ordered = REQUIRED_SECTION_NUMBERS.every((number, index) => numbers[index] === number);

  if (!ordered || sections.some((section) => !section.title || section.blocks.length === 0)) {
    throw new Error('Premium presentation must contain non-empty sections 1 through 9 in order.');
  }
  sections.forEach((section, sectionIndex) => {
    if (typeof presentation.sections[sectionIndex].startOnNewPage !== 'undefined' && typeof presentation.sections[sectionIndex].startOnNewPage !== 'boolean') {
      throw new Error(`Premium presentation requires sections[${sectionIndex}].startOnNewPage to be boolean when supplied.`);
    }
    section.blocks.forEach((block, blockIndex) => validateBlock(block, `sections[${sectionIndex}].blocks[${blockIndex}]`));
  });

  return {
    locale: presentation.locale,
    ui: presentation.ui,
    cover: presentation.cover,
    opening: presentation.opening,
    sections,
  };
}

function normalizedBody(value) {
  return String(value || '').normalize('NFKC')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/gm, '')
    .replace(/^\s*[^:\n]{1,24}\s*[:：]\s*/gm, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

function sanitizePresentationText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/`/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/^\s*\[\s*([^\]\n]+)\s*\]\s*$/gm, '$1')
    .trim();
}

function sanitizePresentation(presentation) {
  if (presentation === null || presentation === undefined) return presentation;
  if (Array.isArray(presentation)) return presentation.map((value) => sanitizePresentation(value));
  if (typeof presentation === 'string') return sanitizePresentationText(presentation);
  if (typeof presentation !== 'object') return presentation;
  const sanitized = {};
  Object.entries(presentation).forEach(([key, value]) => {
    sanitized[key] = sanitizePresentation(value);
  });
  return sanitized;
}

function trigramSet(value) {
  const text = normalizedBody(value);
  if (text.length < 40) return null;
  return new Set([...Array(text.length - 2)].map((_, i) => text.slice(i, i + 3)));
}

function hasRepeatedContent(values) {
  const sets = values.map(trigramSet).filter(Boolean);
  for (let i = 0; i < sets.length; i += 1) for (let j = i + 1; j < sets.length; j += 1) {
    let common = 0;
    sets[i].forEach((gram) => { if (sets[j].has(gram)) common += 1; });
    if (common / Math.min(sets[i].size, sets[j].size) >= 0.9) return true;
  }
  return false;
}

function isStandaloneMarkdownHeading(line) {
  const cleaned = String(line || '').trim()
    .replace(/^\s*(?:[-*]\s*)?(?:\d+[.)]\s*)?/, '')
    .trim();
  if (!cleaned || /[:：]/.test(cleaned)) return false;
  return /^(\*\*.+\*\*|\[.+\]|\*\*\[.+\]\*\*)$/.test(cleaned);
}

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Put every known label at the start of its own line.
 *
 * The group parser is line-oriented, but providers regularly emit a whole group
 * as one paragraph ("1つ目は、**A:** … **B:** … **C:** …") or lead a label with
 * prose. Both shapes carry all the required content and only differ in where the
 * newlines fall, so rather than discard the report we normalise the line breaks
 * first. Lines whose labels already sit at the start are returned untouched, which
 * keeps this a no-op for well-formed output.
 */
function splitInlineLabels(content, labels) {
  const known = labels.filter(isNonEmptyString);
  if (!known.length) return content;
  // Longest first so "Color" cannot pre-empt a longer label starting with it.
  const alt = [...known].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
  const labelRe = new RegExp(`\\*\\*(?:${alt})\\s*[:：]\\*\\*|\\*\\*(?:${alt})\\*\\*\\s*[:：]`, 'g');

  return String(content || '').split(/\r?\n/).map((line) => {
    const hits = [...line.matchAll(labelRe)];
    if (!hits.length) return line;
    // Already well-formed: a single label sitting at the start (after an optional
    // bullet or list marker) is exactly what the parser expects.
    const prefix = line.slice(0, hits[0].index);
    const prefixIsMarkerOnly = /^\s*(?:[-*]|\d+[.)])?\s*$/.test(prefix);
    if (hits.length === 1 && prefixIsMarkerOnly) return line;

    const pieces = [];
    if (!prefixIsMarkerOnly) pieces.push(prefix.trimEnd());
    for (let i = 0; i < hits.length; i += 1) {
      const start = hits[i].index;
      const end = i + 1 < hits.length ? hits[i + 1].index : line.length;
      pieces.push(line.slice(start, end).trimEnd());
    }
    return pieces.filter((p) => p.trim()).join('\n');
  }).join('\n');
}

function parseLabelGroups(content, labels) {
  const wanted = new Set(labels);
  const groups = [];
  let current = {};
  let lastLabel = null;
  const lines = splitInlineLabels(content, labels).split(/\r?\n/);
  lines.forEach((line) => {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*([^*]+?)\s*[:：]\*\*|\*\*([^*]+?)\*\*\s*[:：]|([^:*\n]+?)\s*[:：])\s*(.*)$/);
    const looksLikeStandaloneLabel = isStandaloneMarkdownHeading(line);
    const looksLikeUnknownLabeledHeading = /^\s*(?:[-*]\s*)?\*\*[^*]+?(?:[:：]\*\*|\*\*\s*[:：])/.test(line);
    const appendContinuation = () => {
      const continuation = line.trim().replace(/^\s*(?:[-*]|\d+[.)])\s*/, '');
      if (lastLabel && continuation && !/^#{1,6}\s+/.test(continuation) && !/^-{2,}$/.test(continuation)) current[lastLabel] = [current[lastLabel], continuation].filter(Boolean).join(' ');
    };
    if (!match) {
      if (looksLikeStandaloneLabel) {
        lastLabel = null;
        return;
      }
      appendContinuation();
      return;
    }
    const label = (match[1] || match[2] || match[3] || '').trim();
    if (!wanted.has(label)) {
      if (looksLikeUnknownLabeledHeading) {
        current.__invalidLabel = label;
        lastLabel = null;
        return;
      }
      if (looksLikeStandaloneLabel) {
        lastLabel = null;
        return;
      }
      appendContinuation();
      return;
    }
    if (label === labels[0] && current[labels[0]]) { groups.push(current); current = {}; }
    current[label] = match[4].trim();
    lastLabel = label;
  });
  if (Object.keys(current).length) groups.push(current);
  return groups;
}
function parseTitledGroups(content, expectedCount, labels) {
  const parts = String(content).split(/^###\s+(.+)$/gm).slice(1);
  if (parts.length === expectedCount * 2) {
    const groups = [];
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i].trim(); const fields = parseLabelGroups(parts[i + 1], labels);
      if (fields.length !== 1 || fields[0].__invalidLabel || !labels.every((label) => isNonEmptyString(fields[0][label]))) return null;
      groups.push({ title, fields: fields[0] });
    }
    return groups;
  }
  // A horizontal rule ("---", "***") satisfies the card-title shape, so a trailing
  // separator would inflate the count past expectedCount and discard the report.
  // listGroup already drops these; do the same here.
  const isSeparator = (s) => /^[-*_\s]+$/.test(String(s));
  const cardMatches = [...String(content).matchAll(/^\s*(?:[-*]|\d+[.)])\s*(?:\*\*)?\[?([^*\]\n:]+)\]?(?:\*\*)?\s*$/gm)]
    .filter((m) => !isSeparator(m[1]));
  if (cardMatches.length !== expectedCount) return null;
  const groups = [];
  for (let index = 0; index < cardMatches.length; index += 1) {
    const match = cardMatches[index];
    const contentStart = match.index + match[0].length;
    const contentEnd = index + 1 < cardMatches.length ? cardMatches[index + 1].index : String(content).length;
    const title = match[1].trim(); const fields = parseLabelGroups(String(content).slice(contentStart, contentEnd), labels);
    if (fields.length !== 1 || fields[0].__invalidLabel || !labels.every((label) => isNonEmptyString(fields[0][label]))) return null;
    groups.push({ title, fields: fields[0] });
  }
  return groups;
}
function mergePresentationResult(baseInterpretation, presentationResult) {
  return { ...baseInterpretation, presentationStatus: presentationResult.presentationStatus, ...(presentationResult.presentationStatusReason ? { presentationStatusReason: presentationResult.presentationStatusReason } : {}), ...(presentationResult.presentation ? { presentation: presentationResult.presentation } : {}) };
}

function adaptMarkdownToPresentation({ fullText, manseryeok, fortuneCycles = null, childName = '아이', generatedAt = new Date().toISOString(), language = 'ko' }) {
  const locale = getPremiumPresentationLocale(language);
  const label = locale.labels;
  const generated = locale.generated;
  const sections = parseNumberedSections(fullText);
  if (sections.length !== 9 || sections.some((s, i) => s.number !== i + 1 || !s.content)) {
    return { presentationStatus: 'fallback', presentationStatusReason: 'missing_or_reordered_sections' };
  }
  if (language === 'ko' && /things to remember|de-escalation steps|before\/after/i.test(fullText)) return { presentationStatus: 'fallback', presentationStatusReason: 'localization_leak' };
  const unsafeScanText = fullText
    .replace(/건강\s*진단\s*(?:이나|\/)\s*(?:운명\s*확정|방위\s*풍수)[이가]\s*아(?:닙니다|니라)/gi, '')
    .replace(/의학적\s*진단이나\s*치료가\s*아닙니다/gi, '')
    .replace(/치료나\s*처방이\s*아닙니다/gi, '');
  if (/(건강\s*(?:문제|위험|악화|회복|치료|진단|처방)|질병|치료|처방|신장|폐|대장|심장|방위|풍수|재물|연애|반드시 성공|확정(?:됩니다|이다)|직업으로 확정|진로가 정해)/i.test(unsafeScanText)) return { presentationStatus: 'fallback', presentationStatusReason: 'unsafe_claim' };
  if (language === 'ko' && /산출\s*근거\s*[:：]|계산된\s*사주/i.test(fullText)) return { presentationStatus: 'fallback', presentationStatusReason: 'unsafe_claim' };
  const order = ['year', 'month', 'day', 'hour'];
  const pillarValues = manseryeok?.pillars ? order.map((key) => manseryeok.pillars[key]).filter((p) => p && (p.korean || p.hanja)) : [];
  const elementMap = ELEMENT_LABELS[language] || ELEMENT_LABELS.en;
  const elementKeys = ['wood', 'fire', 'earth', 'metal', 'water'];
  const elementValues = manseryeok?.elements ? elementKeys.map((key) => manseryeok.elements[key]) : [];
  const basis = pillarValues.length >= 3 && elementValues.length >= 5 && elementValues.every((v) => Number.isFinite(Number(v)))
    ? `${elementMap.basisPrefix}: ${pillarValues.map((p) => p.hanja || p.korean).join('·')} / ${elementMap.prefix} ${elementKeys.map((key) => `${elementMap[key]}${manseryeok.elements[key]}`).join('·')}`
    : null;
  if (!basis) return { presentationStatus: 'fallback', presentationStatusReason: 'insufficient_calculated_basis' };
  const cycleMeaningful = fortuneCycles && ((Array.isArray(fortuneCycles.daeunList) && fortuneCycles.daeunList.length > 0) || (Array.isArray(fortuneCycles.seunList) && fortuneCycles.seunList.length > 0));
  if (!cycleMeaningful) return { presentationStatus: 'fallback', presentationStatusReason: 'insufficient_calculated_basis' };

  try {
    const requiredLabelPattern = new RegExp(`${label.s1[3].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\*\\*)?\\s*[:：]`);
    if (!requiredLabelPattern.test(sections[0].content)) return { presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' };
    const s1 = parseLabelGroups(sections[0].content, label.s1);
    const s2 = parseLabelGroups(sections[1].content, label.s2);
    const s3 = parseLabelGroups(sections[2].content, label.s3);
    const s4 = parseLabelGroups(sections[3].content, label.s4);
    const titled5 = parseTitledGroups(sections[4].content, 3, label.s5);
    const section6MonthlyContent = sections[5].content.replace(/\n\s*(?:[-*]|\d+[.)])\s*\*\*\[?부모가\s+이\s+시기에\s+집중할\s+양육\s+포인트[\s\S]*$/m, '');
    const titled6 = parseTitledGroups(section6MonthlyContent, 4, label.s6);
    const s5 = titled5 ? titled5.map((x) => x.fields) : [];
    const s6 = titled6 ? titled6.map((x) => x.fields) : [];
    const s7 = parseLabelGroups(sections[6].content, label.s7);
    const s9 = parseLabelGroups(sections[8].content, [...label.s9, ...label.s9OptionalSummary]);
    const complete = (groups, labels) => groups.length > 0 && groups.every((g) => !g.__invalidLabel && labels.every((l) => isNonEmptyString(g[l])));
    const listGroup = (content, heading, count) => { const m = String(content).match(new RegExp(`(?:\\*\\*|\\[)${heading}(?:\\*\\*|\\])[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?\\[|\\n\\s*\\*\\*|$)`)); if (m) { const values = m[1].split(/\n/).map((x) => x.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim()).filter((x) => x && !/^-{2,}$/.test(x)); return values.length === count ? values : null; } const repeated = [...String(content).matchAll(new RegExp(`(?:\\*\\*)?${heading}(?:\\*\\*)?\\s*[:：]\s*([^\\n]+)`, 'g'))].map((x) => x[1].trim()); return repeated.length === count ? repeated : null; };
    const memory = listGroup(sections[7].content, label.s8[0], 5);
    const stop = listGroup(sections[7].content, label.s8[1], 3);
    const start = listGroup(sections[7].content, label.s8[2], 3);
    const steps = listGroup(sections[7].content, label.s8[3], 3);
    if (!complete(s1, label.s1) || !complete(s2, label.s2) || s2.length < 4 || s2.length > 6 || !complete(s3, label.s3) || s3.length < 5 || s3.length > 7 || !complete(s4, label.s4) || s4.length !== 6 || !complete(s5, label.s5) || s5.length !== 3 || !complete(s6, label.s6) || s6.length !== 4 || !complete(s7, label.s7) || s7.length !== 3 || !memory || !stop || !start || !steps || !complete(s9, label.s9) || s9.length !== 1) return { presentationStatus: 'fallback', presentationStatusReason: 'partial_required_labels' };
    const semanticBodies = [...s2, ...s3, ...s4, ...s5, ...s6].flatMap((g) => Object.values(g));
    const longBodies = semanticBodies.map(normalizedBody).filter((body) => body.length >= 80);
    if (new Set(longBodies).size < longBodies.length || hasRepeatedContent(semanticBodies)) return { presentationStatus: 'fallback', presentationStatusReason: 'duplicate_content' };
    const text = (title, value) => ({ type: 'text', title, text: value });
    const presentation = {
      locale: language,
      ui: locale.ui,
      cover: { kicker: locale.cover.kicker, title: locale.cover.title, child: childName, date: String(generatedAt).slice(0, 10) },
      opening: { title: locale.opening.title, items: [{ title: locale.opening.items[0], text: s1[0][label.s1[0]] }, { title: locale.opening.items[1], text: s1[0][label.s1[3]] }, { title: locale.opening.items[2], text: s1[0][label.s1[4]] }], note: s1[0][label.s1[1]] },
      sections: [
        { number: 1, title: sections[0].title, blocks: [text(label.s1[0], s1[0][label.s1[0]]), { type: 'insight', title: generated.focus, basis, behavior: s1[0][label.s1[1]], action: s1[0][label.s1[3]] }, text(label.s1[2], s1[0][label.s1[2]])] },
        { number: 2, title: sections[1].title, blocks: s2.map((g, i) => ({ type: 'translator', title: generated.scene(i), looksLike: g[label.s2[0]], actual: g[label.s2[1]], response: g[label.s2[2]] })) },
        { number: 3, title: sections[2].title, blocks: s3.map((g, i) => ({ type: 'insight', title: generated.signature(i), basis: `${generated.inferencePrefix}: ${g[label.s3[1]]}`, behavior: g[label.s3[0]], action: `${g[label.s3[3]]} ${label.s3[2]}: ${g[label.s3[2]]}` })) },
        { number: 4, title: sections[3].title, blocks: s4.map((g, i) => ({ type: 'script', title: generated.script(i), before: `${g[label.s4[0]]} (${g[label.s4[1]]})`, after: g[label.s4[2]], signal: g[label.s4[3]] })) },
        { number: 5, title: sections[4].title, blocks: s5.map((g, i) => ({ type: 'insight', title: titled5[i].title, basis: `${generated.referencePrefix}: ${g[label.s5[1]]}`, behavior: g[label.s5[0]], action: `${g[label.s5[2]]} / ${generated.careerHint}: ${g[label.s5[3]]}` })) },
        { number: 6, title: sections[5].title, blocks: [{ type: 'timeline', title: generated.flow, items: s6.map((g, i) => ({ label: titled6[i].title, text: `${g[label.s6[0]]} ${g[label.s6[1]]} ${g[label.s6[2]]} ${generated.avoid}: ${g[label.s6[3]]}` })) }, text(generated.readingMethod, generated.readingMethodText)] },
        { number: 7, title: sections[6].title, blocks: [{ type: 'checklist', title: generated.smallExperiment, items: s7.map((g, i) => ({ label: generated.day(i), text: `${g[label.s7[0]]} / ${generated.reaction}: ${g[label.s7[1]]} / ${generated.success}: ${g[label.s7[2]]}` })) }] },
        { number: 8, title: sections[7].title, blocks: [{ type: 'checklist', title: generated.remember, items: memory.map((v, i) => ({ label: `${i + 1}`, text: v })) }, { type: 'parenting-card', title: generated.card, stop: stop.join(' '), start: start.join(' '), steps: steps.join(' ') }] },
        { number: 9, title: sections[8].title, startOnNewPage: false, blocks: [text(generated.ideas, `${s9[0][label.s9[0]]} / ${s9[0][label.s9[1]]} / ${s9[0][label.s9[2]]}`), { type: 'close', title: generated.close, text: `${s9[0][label.s9[3]]} ${s9[0][label.s9[4]]}` }] },
      ],
    };
    return { presentationStatus: 'ready', presentation: sanitizePresentation(normalizePresentation(presentation)) };
  } catch (error) {
    return { presentationStatus: 'fallback', presentationStatusReason: 'invalid_presentation_contract', diagnostic: error.message };
  }
}

module.exports = {
  REQUIRED_SECTION_NUMBERS,
  BLOCK_REQUIREMENTS,
  parseNumberedSections,
  normalizePresentation,
  normalizedBody,
  sanitizePresentation,
  hasRepeatedContent,
  adaptMarkdownToPresentation,
  mergePresentationResult,
  parseTitledGroups,
  getPremiumPresentationLocale,
};
