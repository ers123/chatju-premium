// backend/src/services/pdf.service.js
// Premium PDF report generation using pdfkit — text-based, ~200-500KB

const path = require('path');
const { formatReportDate, formatBirthDate } = require('../utils/report-date');
const fs = require('fs');
const { parseNumberedSections, normalizePresentation, sanitizePresentation } = require('./report-presentation');

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
  // Simplified Chinese had been riding on the Japanese font, which does not
  // carry simplified-only forms: 时 报 读 说 话 计 结 观 译 and 23 others were
  // blank in the Chinese PDF's own labels, before counting the body text.
  zh: {
    family: 'NotoSansSC',
    regular: path.join(FONTS_DIR, 'NotoSansSC-Regular.otf'),
    bold: path.join(FONTS_DIR, 'NotoSansSC-Bold.otf'),
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
    calculatedProfileTitle: '아이의 기질 지도',
    calculatedProfileKicker: '계산된 프로필',
    elementDistribution: '오행 분포',
    howToReadTitle: '계산된 사실을 읽는 방법',
    howToReadCalcLabel: '계산값',
    howToReadCalcText: '위 표는 입력한 생년월일시를 기준으로 계산한 사주 네 기둥과 오행 분포입니다.',
    howToReadScopeLabel: '해석 범위',
    howToReadScopeText: '뒤의 내용은 이 계산값을 부모가 관찰할 수 있는 행동과 대화 언어로 번역한 참고 가설이며, 아이의 발달이나 미래를 확정하지 않습니다.',
    continued: '계속',
    coverKicker: '아이의 기질을 오늘의 양육 언어로',
    coverTagline: '기질은 예측이 아니라, 아이를 이해하기 위한 참고 지도입니다.',
    openingTitle: '부모를 위한 30초 요약',
    cardNote: '읽는 방법',
    cardObservation: '오늘의 관찰',
    cardInsight: '기질을 행동으로 번역하기',
    cardTranslator: '오해를 번역해 보기',
    cardScript: '대화 스크립트',
    cardTimeline: '이번 시기의 참고 흐름',
    cardChecklist: '7일의 작은 실험',
    cardParentingCard: '곁에 두는 양육 카드',
    cardClose: '마무리',
    cardFallback: '참고',
    presentationUi: {
      basis: '보이는 근거',
      behavior: '관찰할 모습',
      action: '오늘의 대응',
      looksLike: '겉으로는',
      actual: '실제로는',
      response: '더 나은 말',
      before: '이전',
      after: '이후',
      signal: '기대 신호',
      stop: '멈출 말',
      start: '시작할 말',
      steps: '감정이 높을 때',
    },
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
    calculatedProfileTitle: "Your Child's Temperament Map",
    calculatedProfileKicker: 'CALCULATED PROFILE',
    pillarLegend: 'Each pillar is written in the traditional characters the calculation uses — one heavenly stem and one earthly branch. The smaller line beneath it names the two elements that pair carries; the element names are spelled out in the distribution below.',
    elementDistribution: 'Five Elements Distribution',
    howToReadTitle: 'How to Read These Calculations',
    howToReadCalcLabel: 'Calculated values',
    howToReadCalcText: 'The table above shows the Four Pillars and the Five Elements distribution calculated from the birth date and time you entered.',
    howToReadScopeLabel: 'Scope of reading',
    howToReadScopeText: "What follows translates these calculated values into behavior and wording a parent can observe. It is a reference hypothesis and does not determine your child's development or future.",
    continued: 'continued',
    coverKicker: "Your child's temperament, in today's parenting language",
    coverTagline: 'Temperament is not a prediction; it is a reference map for understanding your child.',
    openingTitle: 'A 30-second summary for parents',
    cardNote: 'How to read this',
    cardObservation: "Today's observation",
    cardInsight: 'Translating temperament into behavior',
    cardTranslator: 'Translating the misunderstanding',
    cardScript: 'Conversation script',
    cardTimeline: 'Reference flow for this period',
    cardChecklist: 'A small 7-day experiment',
    cardParentingCard: 'Parenting card to keep nearby',
    cardClose: 'Closing',
    cardFallback: 'Reference',
    presentationUi: {
      basis: 'Calculated basis',
      behavior: 'Signal to observe',
      action: 'Parent action',
      looksLike: 'Looks like',
      actual: 'Actually',
      response: 'Better wording',
      before: 'Old wording',
      after: 'Better wording',
      signal: 'Improvement signal',
      stop: 'Words to stop',
      start: 'Words to start',
      steps: 'When emotions rise',
    },
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
    calculatedProfileTitle: '子どもの気質マップ',
    calculatedProfileKicker: '算出プロフィール',
    elementDistribution: '五行の分布',
    howToReadTitle: '算出された事実の読み方',
    howToReadCalcLabel: '算出値',
    howToReadCalcText: '上の表は、入力された生年月日時をもとに算出した四柱と五行の分布です。',
    howToReadScopeLabel: '解釈の範囲',
    howToReadScopeText: 'これ以降の内容は、この算出値を親が観察できる行動と言葉に翻訳した参考の仮説であり、子どもの発達や未来を確定するものではありません。',
    continued: '続き',
    coverKicker: '子どもの気質を、今日の子育ての言葉に',
    coverTagline: '気質は予言ではなく、子どもを理解するための参考地図です。',
    openingTitle: '親のための30秒サマリー',
    cardNote: '読み方',
    cardObservation: '今日の観察',
    cardInsight: '気質を行動に翻訳する',
    cardTranslator: '誤解を翻訳してみる',
    cardScript: '対話スクリプト',
    cardTimeline: 'この時期の参考フロー',
    cardChecklist: '7日間の小さな実験',
    cardParentingCard: 'そばに置く子育てカード',
    cardClose: '締めくくり',
    cardFallback: '参考',
    presentationUi: {
      basis: '算出された根拠',
      behavior: '観察するサイン',
      action: '親の行動',
      looksLike: '表面上は',
      actual: '実際には',
      response: '言い換える言葉',
      before: 'これまでの言葉',
      after: '言い換える言葉',
      signal: '改善のサイン',
      stop: 'やめる言葉',
      start: '始める言葉',
      steps: '感情が高まる時',
    },
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
    calculatedProfileTitle: '孩子的气质地图',
    calculatedProfileKicker: '推算档案',
    elementDistribution: '五行分布',
    howToReadTitle: '如何阅读这些计算结果',
    howToReadCalcLabel: '计算值',
    howToReadCalcText: '上表是根据您输入的出生年月日时计算出的四柱与五行分布。',
    howToReadScopeLabel: '解读范围',
    howToReadScopeText: '后面的内容是把这些计算结果翻译成父母可以观察的行为和说法的参考假设，并不确定孩子的发展或未来。',
    continued: '续',
    coverKicker: '把孩子的气质，化作今天的养育语言',
    coverTagline: '气质不是预言，而是理解孩子的参考地图。',
    openingTitle: '给父母的30秒摘要',
    cardNote: '阅读方式',
    cardObservation: '今天的观察',
    cardInsight: '把气质翻译成行为',
    cardTranslator: '翻译这个误解',
    cardScript: '对话脚本',
    cardTimeline: '这个时期的参考流程',
    cardChecklist: '7天的小实验',
    cardParentingCard: '放在身边的养育卡片',
    cardClose: '结语',
    cardFallback: '参考',
    presentationUi: {
      basis: '计算依据',
      behavior: '可观察信号',
      action: '父母行动',
      looksLike: '表面看起来',
      actual: '实际上',
      response: '更好的说法',
      before: '原来的话',
      after: '更好的说法',
      signal: '改善信号',
      stop: '停止说的话',
      start: '开始说的话',
      steps: '情绪升高时',
    },
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
    calculatedProfileTitle: 'Bản đồ khí chất của trẻ',
    calculatedProfileKicker: 'HỒ SƠ ĐÃ TÍNH',
    pillarLegend: 'Mỗi trụ được viết bằng chữ truyền thống mà phép tính này dùng: một thiên can và một địa chi. Dòng nhỏ bên dưới cho biết hai hành mà cặp chữ đó mang; tên các hành có trong phần phân bố bên dưới.',
    elementDistribution: 'Phân bố Ngũ hành',
    howToReadTitle: 'Cách đọc các số liệu tính toán',
    howToReadCalcLabel: 'Giá trị tính toán',
    howToReadCalcText: 'Bảng trên là Tứ trụ và phân bố Ngũ hành được tính từ ngày giờ sinh bạn đã nhập.',
    howToReadScopeLabel: 'Phạm vi diễn giải',
    howToReadScopeText: 'Phần sau là giả thuyết tham khảo, dịch các giá trị này thành hành vi và lời nói mà cha mẹ có thể quan sát; nó không quyết định sự phát triển hay tương lai của trẻ.',
    continued: 'tiếp theo',
    coverKicker: 'Khí chất của con, thành lời nuôi dạy hôm nay',
    coverTagline: 'Khí chất không phải lời tiên đoán, mà là bản đồ tham khảo để hiểu con.',
    openingTitle: 'Tóm tắt 30 giây cho cha mẹ',
    cardNote: 'Cách đọc',
    cardObservation: 'Quan sát hôm nay',
    cardInsight: 'Dịch khí chất thành hành vi',
    cardTranslator: 'Dịch lại hiểu lầm',
    cardScript: 'Kịch bản trò chuyện',
    cardTimeline: 'Dòng tham khảo giai đoạn này',
    cardChecklist: 'Thử nghiệm nhỏ 7 ngày',
    cardParentingCard: 'Thẻ nuôi dạy để giữ bên cạnh',
    cardClose: 'Lời kết',
    cardFallback: 'Tham khảo',
    presentationUi: {
      basis: 'Cơ sở tính toán',
      behavior: 'Tín hiệu cần quan sát',
      action: 'Hành động của cha mẹ',
      looksLike: 'Bề ngoài',
      actual: 'Thực ra',
      response: 'Cách nói tốt hơn',
      before: 'Cách nói cũ',
      after: 'Cách nói tốt hơn',
      signal: 'Dấu hiệu cải thiện',
      stop: 'Lời nên dừng',
      start: 'Lời nên bắt đầu',
      steps: 'Khi cảm xúc tăng cao',
    },
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
    calculatedProfileTitle: 'Peta Temperamen Anak',
    calculatedProfileKicker: 'PROFIL TERHITUNG',
    pillarLegend: 'Setiap pilar ditulis dengan aksara tradisional yang dipakai perhitungan ini: satu batang langit dan satu cabang bumi. Baris kecil di bawahnya menyebut dua unsur yang dibawa pasangan itu; namanya tertulis pada distribusi di bawah.',
    elementDistribution: 'Distribusi Lima Unsur',
    howToReadTitle: 'Cara Membaca Hasil Perhitungan Ini',
    howToReadCalcLabel: 'Nilai perhitungan',
    howToReadCalcText: 'Tabel di atas adalah Empat Pilar dan distribusi Lima Unsur yang dihitung dari tanggal dan jam lahir yang Anda masukkan.',
    howToReadScopeLabel: 'Cakupan tafsir',
    howToReadScopeText: 'Bagian berikutnya adalah hipotesis referensi yang menerjemahkan nilai perhitungan ini menjadi perilaku dan ucapan yang dapat diamati orang tua, dan tidak menentukan perkembangan atau masa depan anak.',
    continued: 'lanjutan',
    coverKicker: 'Temperamen anak, dalam bahasa pengasuhan hari ini',
    coverTagline: 'Temperamen bukan ramalan, melainkan peta referensi untuk memahami anak.',
    openingTitle: 'Ringkasan 30 detik untuk orang tua',
    cardNote: 'Cara membaca',
    cardObservation: 'Pengamatan hari ini',
    cardInsight: 'Menerjemahkan temperamen jadi perilaku',
    cardTranslator: 'Menerjemahkan salah paham',
    cardScript: 'Skrip percakapan',
    cardTimeline: 'Alur referensi periode ini',
    cardChecklist: 'Eksperimen kecil 7 hari',
    cardParentingCard: 'Kartu pengasuhan untuk disimpan',
    cardClose: 'Penutup',
    cardFallback: 'Referensi',
    presentationUi: {
      basis: 'Dasar perhitungan',
      behavior: 'Sinyal yang diamati',
      action: 'Tindakan orang tua',
      looksLike: 'Terlihat seperti',
      actual: 'Sebenarnya',
      response: 'Ucapan yang lebih baik',
      before: 'Ucapan lama',
      after: 'Ucapan yang lebih baik',
      signal: 'Tanda membaik',
      stop: 'Kata yang dihentikan',
      start: 'Kata yang dimulai',
      steps: 'Saat emosi naik',
    },
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
    calculatedProfileTitle: 'Mapa del temperamento de tu hijo',
    calculatedProfileKicker: 'PERFIL CALCULADO',
    pillarLegend: 'Cada pilar se escribe con los caracteres tradicionales que usa el cálculo: un tronco celeste y una rama terrestre. La línea más pequeña indica los dos elementos que aporta esa pareja; sus nombres aparecen en la distribución de abajo.',
    elementDistribution: 'Distribución de los Cinco Elementos',
    howToReadTitle: 'Cómo leer estos cálculos',
    howToReadCalcLabel: 'Valores calculados',
    howToReadCalcText: 'La tabla anterior muestra los Cuatro Pilares y la distribución de los Cinco Elementos calculados a partir de la fecha y hora de nacimiento que indicaste.',
    howToReadScopeLabel: 'Alcance de la lectura',
    howToReadScopeText: 'Lo que sigue traduce estos valores calculados en conductas y frases que los padres pueden observar; es una hipótesis de referencia y no determina el desarrollo ni el futuro de tu hijo.',
    continued: 'continuación',
    coverKicker: 'El temperamento de tu hijo, en lenguaje de crianza para hoy',
    coverTagline: 'El temperamento no es una predicción, sino un mapa de referencia para entender a tu hijo.',
    openingTitle: 'Resumen de 30 segundos para los padres',
    cardNote: 'Cómo leerlo',
    cardObservation: 'La observación de hoy',
    cardInsight: 'Traducir el temperamento en conducta',
    cardTranslator: 'Traducir el malentendido',
    cardScript: 'Guion de conversación',
    cardTimeline: 'Flujo de referencia de este periodo',
    cardChecklist: 'Pequeño experimento de 7 días',
    cardParentingCard: 'Tarjeta de crianza para tener cerca',
    cardClose: 'Cierre',
    cardFallback: 'Referencia',
    presentationUi: {
      basis: 'Base calculada',
      behavior: 'Señal a observar',
      action: 'Acción de los padres',
      looksLike: 'Parece',
      actual: 'En realidad',
      response: 'Mejor frase',
      before: 'Frase anterior',
      after: 'Mejor frase',
      signal: 'Señal de mejora',
      stop: 'Frases a detener',
      start: 'Frases a iniciar',
      steps: 'Cuando sube la emoción',
    },
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
    calculatedProfileTitle: 'Mapa do temperamento da criança',
    calculatedProfileKicker: 'PERFIL CALCULADO',
    pillarLegend: 'Cada pilar é escrito com os caracteres tradicionais usados no cálculo: um tronco celeste e um ramo terrestre. A linha menor indica os dois elementos que esse par carrega; os nomes aparecem na distribuição abaixo.',
    elementDistribution: 'Distribuição dos Cinco Elementos',
    howToReadTitle: 'Como ler estes cálculos',
    howToReadCalcLabel: 'Valores calculados',
    howToReadCalcText: 'A tabela acima mostra os Quatro Pilares e a distribuição dos Cinco Elementos calculados a partir da data e hora de nascimento informadas.',
    howToReadScopeLabel: 'Alcance da leitura',
    howToReadScopeText: 'O que vem a seguir traduz estes valores calculados em comportamentos e falas que os pais podem observar; é uma hipótese de referência e não determina o desenvolvimento nem o futuro da criança.',
    continued: 'continuação',
    coverKicker: 'O temperamento da criança, na linguagem parental de hoje',
    coverTagline: 'O temperamento não é uma previsão, mas um mapa de referência para entender a criança.',
    openingTitle: 'Resumo de 30 segundos para os pais',
    cardNote: 'Como ler',
    cardObservation: 'A observação de hoje',
    cardInsight: 'Traduzir o temperamento em comportamento',
    cardTranslator: 'Traduzir o mal-entendido',
    cardScript: 'Roteiro de conversa',
    cardTimeline: 'Fluxo de referência deste período',
    cardChecklist: 'Pequeno experimento de 7 dias',
    cardParentingCard: 'Cartão parental para manter por perto',
    cardClose: 'Encerramento',
    cardFallback: 'Referência',
    presentationUi: {
      basis: 'Base calculada',
      behavior: 'Sinal a observar',
      action: 'Ação dos pais',
      looksLike: 'Parece',
      actual: 'Na prática',
      response: 'Melhor fala',
      before: 'Fala antiga',
      after: 'Melhor fala',
      signal: 'Sinal de melhora',
      stop: 'Falas a parar',
      start: 'Falas a começar',
      steps: 'Quando a emoção sobe',
    },
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
    calculatedProfileTitle: "Carte du tempérament de l'enfant",
    calculatedProfileKicker: 'PROFIL CALCULÉ',
    pillarLegend: 'Chaque pilier est écrit dans les caractères traditionnels utilisés pour le calcul : un tronc céleste et une branche terrestre. La ligne plus petite indique les deux éléments que ce couple porte ; leurs noms figurent dans la répartition ci-dessous.',
    elementDistribution: 'Répartition des Cinq Éléments',
    howToReadTitle: 'Comment lire ces calculs',
    howToReadCalcLabel: 'Valeurs calculées',
    howToReadCalcText: 'Le tableau ci-dessus présente les Quatre Piliers et la répartition des Cinq Éléments calculés à partir de la date et de l’heure de naissance saisies.',
    howToReadScopeLabel: 'Portée de la lecture',
    howToReadScopeText: "La suite traduit ces valeurs calculées en comportements et en formulations que les parents peuvent observer ; c'est un repère hypothétique et cela ne détermine ni le développement ni l'avenir de l'enfant.",
    continued: 'suite',
    coverKicker: "Le tempérament de l'enfant, en mots parentaux pour aujourd'hui",
    coverTagline: "Le tempérament n'est pas une prédiction, mais un repère pour comprendre l'enfant.",
    openingTitle: 'Résumé en 30 secondes pour les parents',
    cardNote: 'Comment le lire',
    cardObservation: "L'observation du jour",
    cardInsight: 'Traduire le tempérament en comportement',
    cardTranslator: 'Traduire le malentendu',
    cardScript: 'Script de conversation',
    cardTimeline: 'Repère pour cette période',
    cardChecklist: 'Petite expérience de 7 jours',
    cardParentingCard: 'Carte parentale à garder près de soi',
    cardClose: 'Clôture',
    cardFallback: 'Repère',
    presentationUi: {
      basis: 'Base calculée',
      behavior: 'Signal à observer',
      action: 'Action parentale',
      looksLike: 'En apparence',
      actual: 'En réalité',
      response: 'Meilleure formulation',
      before: 'Ancienne phrase',
      after: 'Meilleure formulation',
      signal: "Signal d'amélioration",
      stop: 'Phrases à arrêter',
      start: 'Phrases à commencer',
      steps: "Quand l'émotion monte",
    },
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
    calculatedProfileTitle: 'แผนที่ลักษณะนิสัยของลูก',
    calculatedProfileKicker: 'ข้อมูลที่คำนวณได้',
    pillarLegend: 'แต่ละเสาเขียนด้วยอักษรดั้งเดิมที่ใช้ในการคำนวณ คือก้านฟ้าหนึ่งตัวและกิ่งดินหนึ่งตัว บรรทัดเล็กด้านล่างบอกธาตุสองธาตุที่คู่อักษรนั้นมี ชื่อธาตุดูได้จากการกระจายด้านล่าง',
    elementDistribution: 'การกระจายธาตุทั้งห้า',
    howToReadTitle: 'วิธีอ่านผลการคำนวณนี้',
    howToReadCalcLabel: 'ค่าที่คำนวณได้',
    howToReadCalcText: 'ตารางด้านบนคือเสาหลักทั้งสี่และการกระจายธาตุทั้งห้า ซึ่งคำนวณจากวันและเวลาเกิดที่คุณกรอก',
    howToReadScopeLabel: 'ขอบเขตการตีความ',
    howToReadScopeText: 'เนื้อหาต่อจากนี้คือสมมติฐานอ้างอิงที่แปลค่าการคำนวณเหล่านี้เป็นพฤติกรรมและคำพูดที่พ่อแม่สังเกตได้ และไม่ได้กำหนดพัฒนาการหรืออนาคตของลูก',
    continued: 'ต่อ',
    coverKicker: 'แปลลักษณะนิสัยของลูกเป็นคำพูดเลี้ยงดูในวันนี้',
    coverTagline: 'ลักษณะนิสัยไม่ใช่คำทำนาย แต่เป็นแผนที่อ้างอิงเพื่อเข้าใจลูก',
    openingTitle: 'สรุป 30 วินาทีสำหรับพ่อแม่',
    cardNote: 'วิธีอ่าน',
    cardObservation: 'การสังเกตวันนี้',
    cardInsight: 'แปลลักษณะนิสัยเป็นพฤติกรรม',
    cardTranslator: 'แปลความเข้าใจผิด',
    cardScript: 'บทสนทนา',
    cardTimeline: 'แนวโน้มอ้างอิงช่วงนี้',
    cardChecklist: 'การทดลองเล็ก ๆ 7 วัน',
    cardParentingCard: 'การ์ดเลี้ยงดูที่เก็บไว้ใกล้ตัว',
    cardClose: 'ปิดท้าย',
    cardFallback: 'อ้างอิง',
    presentationUi: {
      basis: 'ฐานการคำนวณ',
      behavior: 'สัญญาณที่ควรสังเกต',
      action: 'การกระทำของพ่อแม่',
      looksLike: 'ดูเหมือนว่า',
      actual: 'จริง ๆ แล้ว',
      response: 'คำพูดที่ดีกว่า',
      before: 'คำพูดเดิม',
      after: 'คำพูดที่ดีกว่า',
      signal: 'สัญญาณที่ดีขึ้น',
      stop: 'คำพูดที่ควรหยุด',
      start: 'คำพูดที่ควรเริ่ม',
      steps: 'เมื่ออารมณ์สูงขึ้น',
    },
  },
};

function getLabels(language) {
  return LABELS[language] || LABELS.en;
}

// ─── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  headerBg: '#24352F',
  gold: '#A47C3F',
  darkText: '#24352F',
  bodyText: '#30332F',
  lightText: '#6D6A64',
  subtleText: '#918A80',
  divider: '#D8CFC0',
  pillarBg: '#24352F',
  pageBg: '#F5F0E7',
  surface: '#FBF9F4',
  sage: '#60776C',
  oxide: '#92594E',
};

const ELEMENT_COLORS = {
  wood: '#60776C',
  fire: '#92594E',
  earth: '#A47C3F',
  metal: '#6F7774',
  water: '#526977',
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
  const { childName, birthDate, gender, manseryeok, aiInterpretation, language, generatedAt, timeZone } = params;
  const labels = getLabels(language || 'ko');

  // The calculator returns element names in Korean ("금 + 화"), and the pillar card
  // prints them straight under the hanja. The legacy renderer converts them; the
  // structured one did not, so an English report showed "금 + 화" on its own cover
  // page. Hanja rather than translated words: the cell is a quarter of the page
  // wide, and 木/火 sit naturally beside the pillar characters above them.
  const ELEMENT_HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  const localizePillarElement = (value) => {
    const text = String(value || '');
    if (!text || (language || 'ko') === 'ko') return text;
    return text.replace(/[목화토금수]/g, (m) => ELEMENT_HANJA[m] || m);
  };
  const reportDate = generatedAt ? new Date(generatedAt) : new Date();
  // toISOString() is UTC, so a KST/JST reader generating before 09:00 saw
  // yesterday's date on the cover. See utils/report-date.js.
  const reportDateLabel = formatReportDate(reportDate, timeZone);
  // 프론트가 보내는 `2017.06.14`는 한국식 표기다. 독자 언어의 관행으로 옮긴다.
  const birthDateLabel = formatBirthDate(birthDate, language || 'ko');

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
      for (const key of ['default', 'ja', 'th', 'zh']) {
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

      const activeFontKey = language === 'th' ? 'th'
        : language === 'zh' ? (registeredFonts.zh.hasFont ? 'zh' : 'ja')
          : language === 'ja' ? 'ja' : 'default';
      const fontRegular = registeredFonts[activeFontKey].regular;
      const fontBold = registeredFonts[activeFontKey].bold;
      const pillarCardFont = registeredFonts.ja.bold || registeredFonts.ja.regular || fontBold;

      console.log('[PDF] Using fonts:', { fontRegular, fontBold });

      // NotoSansThaiLooped carries 200 glyphs: Thai, and almost nothing else. It
      // has no Latin letters, no digits, and no hanja, so every Thai PDF was
      // printing "SoMyung | somyung.cc | 3 / 17" as empty boxes, along with the
      // element counts, the percentages, and the pillar elements (火+金 came out
      // as "+"). Verified against the font's own glyph table, not inferred.
      //
      // pdfkit has no font fallback, so the document's text() is wrapped where the
      // active font cannot cover every script the report can contain:
      //
      // - th: NotoSansThaiLooped carries Thai and almost nothing else — Latin,
      //   digits and hanja go to NotoSansJP (exactly complementary, verified
      //   against the glyph tables).
      // - ja/zh/th + 한글: 아이 이름이 한글일 수 있다(리포트가 본문에서 이름을
      //   부른다). NotoSansJP·SC·Thai 어느 것에도 한글 글리프가 없어서, 한글 런은
      //   NotoSansKR로 보낸다. 이름 호명을 넣기 전에도 표지의 이름이 이미 이
      //   함정을 밟고 있었다 — fontkit 글리프 표로 확정하고 고친다.
      //
      // ko와 라틴 문자권 언어는 NotoSansKR이 활성 폰트라 래핑이 필요 없다.
      const HANGUL = /[가-힣]/;
      const THAI_BLOCK = /[฀-๿]/;
      const krFallback = registeredFonts.default.hasFont
        ? { regular: registeredFonts.default.regular, bold: registeredFonts.default.bold || registeredFonts.default.regular }
        : null;
      const jaFallback = registeredFonts.ja.hasFont
        ? { regular: registeredFonts.ja.regular, bold: registeredFonts.ja.bold || registeredFonts.ja.regular }
        : null;

      // 글자 → 폰트 패밀리. null이면 활성 폰트 그대로.
      const familyFor = (ch) => {
        if (HANGUL.test(ch)) return krFallback;
        if (activeFontKey === 'th' && !THAI_BLOCK.test(ch)) return jaFallback;
        return null;
      };

      const needsScriptWrapper = (activeFontKey === 'th' && jaFallback) || ((activeFontKey === 'ja' || activeFontKey === 'zh') && krFallback);

      if (needsScriptWrapper) {
        const rawFont = doc.font.bind(doc);
        const rawText = doc.text.bind(doc);
        let currentFont = fontRegular;

        doc.font = function (name, ...rest) {
          if (typeof name === 'string') currentFont = name;
          return rawFont(name, ...rest);
        };

        const fontForFamily = (family) => {
          if (!family) return currentFont;
          return currentFont === fontBold ? family.bold : family.regular;
        };

        // Whitespace is neutral — it joins the run in progress so a sentence
        // does not fragment at every space.
        const splitRuns = (str) => {
          const runs = [];
          for (const ch of Array.from(str)) {
            const family = /\s/.test(ch) && runs.length ? runs[runs.length - 1].family : familyFor(ch);
            if (runs.length && runs[runs.length - 1].family === family) runs[runs.length - 1].text += ch;
            else runs.push({ family, text: ch });
          }
          return runs;
        };

        doc.text = function (str, ...rest) {
          if (typeof str !== 'string' || str === '') return rawText(str, ...rest);
          const runs = splitRuns(str);

          // One run: draw it whole, so x/y/width/align behave exactly as before.
          if (runs.length === 1) {
            if (!runs[0].family) return rawText(str, ...rest);
            rawFont(fontForFamily(runs[0].family));
            const result = rawText(str, ...rest);
            rawFont(currentFont);
            return result;
          }

          // Mixed: pdfkit's `continued` keeps wrapping and line breaking intact
          // across the runs while the font changes between them.
          const optsIndex = rest.findIndex((a) => a && typeof a === 'object');
          const opts = optsIndex >= 0 ? rest[optsIndex] : {};
          const positional = optsIndex >= 0 ? rest.slice(0, optsIndex) : rest;
          let result = doc;
          runs.forEach((run, i) => {
            const last = i === runs.length - 1;
            rawFont(fontForFamily(run.family));
            const runOpts = { ...opts, continued: !last };
            result = i === 0
              ? rawText(run.text, ...positional, runOpts)
              : rawText(run.text, runOpts);
          });
          rawFont(currentFont);
          return result;
        };
      }

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

      // ─── Structured editorial renderer ──────────────────────────────
      // The ready path uses square, measured blocks. Every value is measured
      // with the exact width/font used for drawing, and long content is split
      // at row or word boundaries before a frame is painted.
      const CARD = {
        outerPad: 16,
        titleGap: 11,
        rowGap: 8,
        labelWidth: 106,
        columnGap: 12,
        bodyFontSize: 9.5,
        labelFontSize: 8.5,
        titleFontSize: 10.5,
        lineGap: 4,
      };
      const CARD_INNER_W = CONTENT_W - (CARD.outerPad * 2);
      const CARD_BODY_W = CARD_INNER_W - CARD.labelWidth - CARD.columnGap;
      let activeSection = null;
      let activePresentationUi = { ...labels.presentationUi };

      function textHeight(text, font, fontSize, width, lineGap = 0) {
        doc.font(font).fontSize(fontSize);
        return doc.heightOfString(String(text || ''), { width, lineGap });
      }

      function measurePresentationRow(row) {
        const hasLabel = Boolean(row.label);
        const bodyWidth = hasLabel ? CARD_BODY_W : CARD_INNER_W;
        const labelHeight = hasLabel
          ? textHeight(row.label, fontBold, CARD.labelFontSize, CARD.labelWidth, 1)
          : 0;
        const bodyHeight = textHeight(row.text, fontRegular, CARD.bodyFontSize, bodyWidth, CARD.lineGap);
        return Math.max(labelHeight, bodyHeight) + CARD.rowGap;
      }

      function splitTextToHeight(text, width, maxHeight) {
        const value = String(text || '').trim();
        if (!value) return ['', ''];
        if (textHeight(value, fontRegular, CARD.bodyFontSize, width, CARD.lineGap) <= maxHeight) {
          return [value, ''];
        }

        const words = value.split(/\s+/);
        let low = 1;
        let high = words.length;
        let best = 0;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const candidate = words.slice(0, mid).join(' ');
          if (textHeight(candidate, fontRegular, CARD.bodyFontSize, width, CARD.lineGap) <= maxHeight) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (best > 0) return [words.slice(0, best).join(' '), words.slice(best).join(' ')];

        let charLow = 1;
        let charHigh = value.length;
        let charBest = 1;
        while (charLow <= charHigh) {
          const mid = Math.floor((charLow + charHigh) / 2);
          if (textHeight(value.slice(0, mid), fontRegular, CARD.bodyFontSize, width, CARD.lineGap) <= maxHeight) {
            charBest = mid;
            charLow = mid + 1;
          } else {
            charHigh = mid - 1;
          }
        }
        return [value.slice(0, charBest), value.slice(charBest).trim()];
      }

      function writeSectionContinuation() {
        if (!activeSection) {
          doc.y = 68;
          return;
        }
        doc.y = 58;
        doc.font(fontRegular).fontSize(8.5).fillColor(COLORS.gold)
          .text(`${String(activeSection.number).padStart(2, '0')} · ${labels.continued}`, MARGIN_L, doc.y, { width: CONTENT_W });
        doc.font(fontBold).fontSize(13).fillColor(COLORS.darkText)
          .text(activeSection.title, MARGIN_L, doc.y + 14, { width: CONTENT_W });
        doc.y += 42;
      }

      function drawPresentationFrame(title, rows, accent, continued) {
        const titleHeight = textHeight(
          continued ? `${title} · ${labels.continued}` : title,
          fontBold,
          CARD.titleFontSize,
          CARD_INNER_W,
          1
        );
        const rowsHeight = rows.reduce((sum, row) => sum + measurePresentationRow(row), 0);
        const height = CARD.outerPad + titleHeight + CARD.titleGap + rowsHeight + (CARD.outerPad - CARD.rowGap);
        const y = doc.y;

        doc.save();
        doc.rect(MARGIN_L, y, CONTENT_W, height).fill(COLORS.surface);
        doc.rect(MARGIN_L, y, CONTENT_W, height)
          .lineWidth(0.55).strokeColor(COLORS.divider).stroke();
        doc.rect(MARGIN_L, y, CONTENT_W, 3).fill(accent);
        doc.restore();

        doc.font(fontBold).fontSize(CARD.titleFontSize).fillColor(COLORS.darkText)
          .text(continued ? `${title} · ${labels.continued}` : title, MARGIN_L + CARD.outerPad, y + CARD.outerPad, {
            width: CARD_INNER_W,
            lineGap: 1,
          });
        let rowY = y + CARD.outerPad + titleHeight + CARD.titleGap;
        rows.forEach((row, index) => {
          const hasLabel = Boolean(row.label);
          const bodyX = hasLabel
            ? MARGIN_L + CARD.outerPad + CARD.labelWidth + CARD.columnGap
            : MARGIN_L + CARD.outerPad;
          const bodyWidth = hasLabel ? CARD_BODY_W : CARD_INNER_W;
          const rowHeight = measurePresentationRow(row);

          if (index > 0) {
            doc.moveTo(MARGIN_L + CARD.outerPad, rowY - 4)
              .lineTo(MARGIN_L + CONTENT_W - CARD.outerPad, rowY - 4)
              .lineWidth(0.35).strokeColor(COLORS.divider).stroke();
          }
          if (hasLabel) {
            doc.font(fontBold).fontSize(CARD.labelFontSize).fillColor(accent)
              .text(row.label, MARGIN_L + CARD.outerPad, rowY, {
                width: CARD.labelWidth,
                lineGap: 1,
              });
          }
          doc.font(fontRegular).fontSize(CARD.bodyFontSize).fillColor(COLORS.bodyText)
            .text(row.text, bodyX, rowY, { width: bodyWidth, lineGap: CARD.lineGap });
          rowY += rowHeight;
        });

        doc.y = y + height + 12;
      }

      function writePresentationCard(title, rows, accent = COLORS.gold) {
        const pending = rows.map((row) => ({
          label: String(row.label || ''),
          text: String(row.text || ''),
        }));
        let continued = false;

        while (pending.length > 0) {
          const titleText = continued ? `${title} · ${labels.continued}` : title;
          const titleHeight = textHeight(titleText, fontBold, CARD.titleFontSize, CARD_INNER_W, 1);
          const fixedHeight = CARD.outerPad + titleHeight + CARD.titleGap + (CARD.outerPad - CARD.rowGap);
          const minimumRowHeight = Math.min(56, measurePresentationRow(pending[0]));

          if (doc.y + fixedHeight + minimumRowHeight > FOOTER_Y) {
            doc.addPage();
            writeSectionContinuation();
          }

          const availableRowsHeight = FOOTER_Y - doc.y - fixedHeight - 12;
          const pageRows = [];
          let usedHeight = 0;

          while (pending.length > 0) {
            const row = pending[0];
            const rowHeight = measurePresentationRow(row);
            if (usedHeight + rowHeight <= availableRowsHeight) {
              pageRows.push(row);
              usedHeight += rowHeight;
              pending.shift();
              continue;
            }

            if (pageRows.length === 0) {
              const hasLabel = Boolean(row.label);
              const bodyWidth = hasLabel ? CARD_BODY_W : CARD_INNER_W;
              const labelHeight = hasLabel
                ? textHeight(row.label, fontBold, CARD.labelFontSize, CARD.labelWidth, 1)
                : 0;
              const maxBodyHeight = Math.max(24, availableRowsHeight - CARD.rowGap);
              const [head, rest] = splitTextToHeight(row.text, bodyWidth, Math.max(maxBodyHeight, labelHeight));
              pageRows.push({ label: row.label, text: head });
              pending.shift();
              if (rest) pending.unshift({
                label: row.label ? `${row.label} · ${labels.continued}` : '',
                text: rest,
              });
            }
            break;
          }

          drawPresentationFrame(title, pageRows, accent, continued);
          continued = pending.length > 0;
          if (continued) {
            doc.addPage();
            writeSectionContinuation();
          }
        }
      }

      function writeStructuredBlock(block) {
        const ui = activePresentationUi;
        const type = block.type || 'text';
        // 장 도입 산문. 카드가 아니라 **본문 문단**으로 그린다 — 카드로 그리면
        // 라벨이 하나 더 늘어날 뿐이고, 이 블록의 목적은 독자가 라벨보다 먼저
        // 사람 목소리를 만나게 하는 것이다.
        if (type === 'prose') {
          const body = String(block.text || '').trim();
          if (!body) return;
          ensureSpace(40);
          renderRichText(body, MARGIN_L, doc.y, { fontSize: 10.5, color: COLORS.bodyText, lineGap: 6 });
          doc.moveDown(0.6);
          return;
        }
        if (type === 'text' || type === 'note') {
          writePresentationCard(block.title || (type === 'note' ? labels.cardNote : labels.cardObservation), [{ text: block.text || '' }], type === 'note' ? ELEMENT_COLORS.water : COLORS.gold);
          return;
        }
        if (type === 'insight') {
          // A block may carry its own rows when the generic basis/behavior/action
          // labels would misdescribe its content (section 5's strength cards).
          const rows = Array.isArray(block.rows) && block.rows.length
            ? block.rows.filter((r) => r && r.label && r.text).map((r) => ({ label: r.label, text: r.text }))
            : [
              { label: ui.basis, text: block.basis || '' },
              { label: ui.behavior, text: block.behavior || '' },
              { label: ui.action, text: block.action || '' },
            ];
          writePresentationCard(block.title || labels.cardInsight, rows, ELEMENT_COLORS.wood);
          return;
        }
        if (type === 'translator') {
          writePresentationCard(block.title || labels.cardTranslator, [
            { label: ui.looksLike, text: block.looksLike || '' },
            { label: ui.actual, text: block.actual || '' },
            { label: ui.response, text: block.response || '' },
          ], ELEMENT_COLORS.fire);
          return;
        }
        if (type === 'script') {
          writePresentationCard(block.title || labels.cardScript, [
            { label: ui.before, text: block.before || '' },
            { label: ui.after, text: block.after || '' },
            { label: ui.signal, text: block.signal || '' },
          ], ELEMENT_COLORS.water);
          return;
        }
        if (type === 'timeline') {
          writePresentationCard(block.title || labels.cardTimeline, (block.items || []).map((item) => ({ label: item.label, text: item.text })), ELEMENT_COLORS.earth);
          return;
        }
        if (type === 'checklist') {
          writePresentationCard(block.title || labels.cardChecklist, (block.items || []).map((item) => ({ label: item.label, text: `□ ${item.text}` })), ELEMENT_COLORS.wood);
          return;
        }
        if (type === 'parenting-card') {
          writePresentationCard(block.title || labels.cardParentingCard, [
            { label: ui.stop, text: block.stop || '' },
            { label: ui.start, text: block.start || '' },
            { label: ui.steps, text: block.steps || '' },
          ], COLORS.gold);
          return;
        }
        if (type === 'close') {
          writePresentationCard(block.title || labels.cardClose, [{ text: block.text || '' }], COLORS.headerBg);
          return;
        }
        writePresentationCard(block.title || labels.cardFallback, [{ text: block.text || '' }]);
      }

      function renderCalculatedProfilePage() {
        const pillars = manseryeok?.pillars;
        const elements = manseryeok?.elements;
        if (!pillars && !elements) return;

        doc.addPage();
        doc.y = 68;
        doc.font(fontRegular).fontSize(9).fillColor(COLORS.gold)
          .text(labels.calculatedProfileKicker || 'CALCULATED PROFILE', MARGIN_L, doc.y, { width: CONTENT_W });
        doc.font(fontBold).fontSize(21).fillColor(COLORS.darkText)
          .text(labels.calculatedProfileTitle, MARGIN_L, doc.y + 18, { width: CONTENT_W });
        doc.y += 66;

        if (pillars) {
          const pillarKeys = ['year', 'month', 'day', 'hour'];
          const pillarW = CONTENT_W / 4;
          const y = doc.y;
          pillarKeys.forEach((key, index) => {
            const x = MARGIN_L + (pillarW * index);
            const pillar = pillars[key];
            doc.rect(x, y, pillarW, 25).fill(COLORS.headerBg);
            doc.rect(x, y + 25, pillarW, 66).fill(COLORS.surface);
            doc.rect(x, y, pillarW, 91).lineWidth(0.5).strokeColor(COLORS.divider).stroke();
            doc.font(fontBold).fontSize(8).fillColor('#F5F0E7')
              .text(labels.pillars[index], x, y + 8, { width: pillarW, align: 'center' });
            doc.font(pillarCardFont).fontSize(20).fillColor(COLORS.darkText)
              .text(pillar?.hanja || pillar?.korean || '-', x, y + 37, { width: pillarW, align: 'center' });
            doc.font(fontRegular).fontSize(8).fillColor(COLORS.lightText)
              .text(localizePillarElement(pillar?.element || pillar?.오행 || ''), x, y + 67, { width: pillarW, align: 'center' });
          });
          doc.y = y + 112;

          // A French or Spanish reader sees four characters they cannot read and
          // no clue what they are. Readers of Korean, Japanese and Chinese can
          // read them, so those locales carry no legend and lose no space to one.
          if (labels.pillarLegend) {
            doc.font(fontRegular).fontSize(7.5).fillColor(COLORS.lightText)
              .text(labels.pillarLegend, MARGIN_L, doc.y, { width: CONTENT_W, lineGap: 1.5 });
            doc.y += 12;
          }
        }

        if (elements) {
          doc.font(fontBold).fontSize(11).fillColor(COLORS.darkText)
            .text(labels.elementDistribution, MARGIN_L, doc.y, { width: CONTENT_W });
          doc.y += 25;
          const keys = ['wood', 'fire', 'earth', 'metal', 'water'];
          const colors = keys.map((key) => ELEMENT_COLORS[key]);
          const total = keys.reduce((sum, key) => sum + Number(elements[key] || 0), 0) || 1;
          keys.forEach((key, index) => {
            const y = doc.y;
            const value = Number(elements[key] || 0);
            const pct = Math.round((value / total) * 100);
            doc.font(fontBold).fontSize(8.5).fillColor(COLORS.bodyText)
              .text(labels.elements[index], MARGIN_L, y + 2, { width: 76 });
            doc.rect(MARGIN_L + 82, y, 295, 13).fill('#E5DED2');
            doc.rect(MARGIN_L + 82, y, Math.max(3, 295 * (value / total)), 13).fill(colors[index]);
            doc.font(fontRegular).fontSize(8).fillColor(COLORS.lightText)
              .text(`${value} · ${pct}%`, MARGIN_L + 390, y + 1, { width: 90, align: 'right' });
            doc.y += 23;
          });
        }

        doc.y += 12;
        writePresentationCard(labels.howToReadTitle, [{
          label: labels.howToReadCalcLabel,
          text: labels.howToReadCalcText,
        }, {
          label: labels.howToReadScopeLabel,
          text: labels.howToReadScopeText,
        }], COLORS.sage);
      }

      function renderStructuredPresentation(presentation) {
        activePresentationUi = { ...activePresentationUi, ...(presentation.ui || {}) };
        const cover = presentation.cover;
        // Cover has no report body: the first analytical content starts on page two.
        doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.headerBg);
        doc.font(fontBold).fontSize(30).fillColor(COLORS.gold)
          .text('SoMyung', MARGIN_L, 105, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(12).fillColor('#DDD4C8')
          .text(cover.kicker || labels.coverKicker, MARGIN_L, 158, { width: CONTENT_W, align: 'center' });
        doc.font(fontBold).fontSize(25).fillColor('#FFFFFF')
          .text(cover.title || labels.premiumReport, MARGIN_L, 248, { width: CONTENT_W, align: 'center', lineGap: 8 });
        doc.font(fontRegular).fontSize(12).fillColor('#DDD4C8')
          .text(cover.child || childName || '', MARGIN_L, 340, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(10).fillColor('#BFB7AD')
          .text(cover.date || `${labels.generatedOn}: ${reportDateLabel}`, MARGIN_L, 375, { width: CONTENT_W, align: 'center' });
        doc.font(fontRegular).fontSize(9).fillColor('#BFB7AD')
          .text(labels.coverTagline, MARGIN_L, 675, { width: CONTENT_W, align: 'center' });

        doc.addPage();
        doc.y = 82;
        doc.font(fontBold).fontSize(21).fillColor(COLORS.darkText)
          .text(presentation.opening.title || labels.openingTitle, MARGIN_L, doc.y, { width: CONTENT_W });
        doc.moveDown(0.8);
        for (const item of presentation.opening.items || []) {
          writePresentationCard(item.title, [{ text: item.text }], item.accent || COLORS.gold);
        }
        if (presentation.opening.note) writeStructuredBlock({ type: 'note', text: presentation.opening.note });
        renderCalculatedProfilePage();

        for (const section of presentation.sections) {
          activeSection = { number: section.number, title: section.title };
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
            .text(String(section.number).padStart(2, '0'), MARGIN_L, doc.y, { width: CONTENT_W });
          doc.font(fontBold).fontSize(20).fillColor(COLORS.darkText)
            .text(section.title, MARGIN_L, doc.y + 18, { width: CONTENT_W });
          doc.y += 56;
          for (const block of section.blocks) writeStructuredBlock(block);
        }
      }


      const presentation = aiInterpretation?.presentationStatus === 'ready'
        ? sanitizePresentation(normalizePresentation(aiInterpretation.presentation))
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
      doc.text(`${labels.birthDate}: ${birthDateLabel || '-'}`, MARGIN_L, infoY);
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
