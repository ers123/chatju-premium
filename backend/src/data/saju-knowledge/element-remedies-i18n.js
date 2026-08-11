// 오행 생활 보완표(색·음식·활동)의 언어별 저작본
//
// 왜 필요한가
// ---------------------------------
// 원본 표는 saju.service.js에 한국어로 하드코딩돼 있고, 리포트 언어와 무관하게
// 그대로 Call 2에 주입된다. 두 가지가 잘못된다.
//
// 1) 한국어 낱말이 그대로 출력에 새어 나온다. 2026-08-12 측정에서 영어 리포트에
//    `미역`, `해조류`, `기준`이 그대로 인쇄된 것을 확인했다. 대사 저작본으로는
//    잡히지 않는다 — 이건 대사가 아니라 분석·추천 데이터이기 때문이다.
// 2) 번역이 되더라도 조언이 한국 부엌에서 나온 것이다. "수 기운 보완 = 미역,
//    해조류"는 프랑스 가정이 이번 주에 실행할 수 있는 조언이 아니다.
//
// 그래서 번역이 아니라 그 문화의 부엌·놀이에서 같은 논리를 만족하는 항목으로
// 다시 고른다. 오행 논리 자체는 보존한다:
//   목 = 초록·신맛·자라는 것·바깥·손으로 만들기
//   화 = 빨강·쓴맛·움직임·표현
//   토 = 노랑/갈색·단맛·뿌리와 곡물·돌보기·정리
//   금 = 흰색/회색·매운맛·정확함
//   수 = 검정/짙은 파랑·짠맛·바다와 어두운 색 food·물·조용함
//
// 저작본이 없는 언어는 한국어 원본으로 폴백한다(기존 동작 유지).

const ELEMENT_REMEDIES_I18N = {
  en: {
    '목': { colors: 'blue, green, fresh lime green', foods: 'spinach, broccoli, green beans, sour fruits (green apples, lemons), sugar snap peas', activities: 'hiking, nature walks, gardening, drawing and painting, simple woodworking', season: 'Spring', avoidExcess: 'pressure to grow up faster than they are ready for, relentlessly competitive surroundings' },
    '화': { colors: 'red, orange, purple', foods: 'tomatoes, carrots, red berries, bell peppers, bitter greens (rocket, radicchio) or green tea', activities: 'running, dance, drama club, show-and-tell or class presentations, team sports', season: 'Summer', avoidExcess: 'overstimulation, late nights and lost sleep, too much screen time' },
    '토': { colors: 'yellow, brown, beige, ochre', foods: 'sweet potatoes, potatoes, pumpkin and winter squash, oats and brown rice, honey', activities: 'cooking and baking together, pottery or clay, tidying their own shelf, tending a garden bed or window box, board games', season: 'The turn of the seasons, late summer', avoidExcess: 'abrupt changes of home or school environment, rules that shift from one day to the next' },
    '금': { colors: 'white, silver, grey, cream', foods: 'pears, radishes, onions, white rice, pungent foods (ginger, horseradish)', activities: 'jigsaw puzzles, LEGO and model building, practising an instrument, writing stories, beginner coding', season: 'Autumn', avoidExcess: 'vague expectations, unfair treatment, being criticised in front of others' },
    '수': { colors: 'black, navy, deep blue', foods: 'nori seaweed snacks, black beans, sardines or anchovies, tofu, lightly salted broths', activities: 'swimming, reading, quiet breathing or mindfulness time, keeping a journal, exploring by a lake or the sea', season: 'Winter', avoidExcess: 'emotional isolation, a household atmosphere of constant worry or anxiety' },
  },
  ja: {
    '목': { colors: '青、緑、若草色', foods: 'ほうれん草、ブロッコリー、小松菜などの青菜、酸味のある果物（みかん、レモン）、豆苗', activities: '山歩き、散歩、園芸、お絵かき、木工工作', season: '春', avoidExcess: '過度な成長へのプレッシャー、競争ばかりの環境' },
    '화': { colors: '赤、オレンジ、紫', foods: 'トマト、にんじん、赤い果物（いちご、すいか）、苦味のある食品（緑茶、ゴーヤ）', activities: 'かけっこ、ダンス、劇や発表会、音読やスピーチ、体育・スポーツ少年団', season: '夏', avoidExcess: '刺激の与えすぎ、睡眠不足、メディアの見すぎ' },
    '토': { colors: '黄色、茶色、ベージュ、山吹色', foods: 'さつまいも、じゃがいも、かぼちゃ、玄米、甘みのある根菜', activities: 'お料理、陶芸や粘土遊び、片づけ・整理整頓、家庭菜園、ボードゲーム', season: '季節の変わり目（土用）', avoidExcess: '急激な環境の変化、日によって変わる一貫性のないルール' },
    '금': { colors: '白、銀、グレー、クリーム色', foods: '梨、大根、玉ねぎ、白いごはん、辛味のある食品（しょうが、みょうが）', activities: 'パズル、レゴやブロック、楽器の練習、作文、プログラミング', season: '秋', avoidExcess: 'あいまいな基準、不公平な扱い、人前での叱責' },
    '수': { colors: '黒、紺、濃い青', foods: 'わかめ、ひじきなどの海藻、黒豆、豆腐、みそ汁などの塩気のある汁物', activities: '水泳、読書、静かな呼吸の時間、日記を書くこと、自然観察', season: '冬', avoidExcess: '情緒的な孤立、心配や不安が絶えない環境' },
  },
  fr: {
    '목': { colors: 'bleu, vert, vert tendre', foods: 'épinards, brocolis, haricots verts, fruits acidulés (pomme verte, citron), petits pois', activities: 'randonnée, promenades en forêt, jardinage, dessin et peinture, bricolage sur bois', season: 'le printemps', avoidExcess: 'la pression de grandir trop vite, un environnement trop compétitif' },
    '화': { colors: 'rouge, orange, violet', foods: 'tomates, carottes, fruits rouges, poivrons, légumes amers (roquette, endives) ou thé vert', activities: 'course à pied, danse, théâtre, exposés devant la classe, sport en club', season: 'l\'été', avoidExcess: 'la surstimulation, le manque de sommeil, trop d\'écrans' },
    '토': { colors: 'jaune, brun, beige, ocre', foods: 'patate douce, pommes de terre, courge, riz complet et flocons d\'avoine, compote de pommes', activities: 'cuisiner et pâtisser, poterie ou pâte à modeler, ranger sa chambre, entretenir un potager ou une jardinière, jeux de société', season: 'l\'intersaison, la fin de l\'été', avoidExcess: 'les changements de cadre trop brusques, des règles qui changent d\'un jour à l\'autre' },
    '금': { colors: 'blanc, argenté, gris, crème', foods: 'poires, radis, oignons, riz blanc, aliments piquants (gingembre, moutarde)', activities: 'puzzles, LEGO et maquettes, pratique d\'un instrument, écriture d\'histoires, initiation au code', season: 'l\'automne', avoidExcess: 'des attentes floues, un traitement injuste, les remarques faites en public' },
    '수': { colors: 'noir, bleu marine, bleu profond', foods: 'algues (nori), haricots noirs, sardines, tofu, bouillons légèrement salés', activities: 'natation, lecture, temps calme de respiration, tenir un journal, explorer la nature au bord de l\'eau', season: 'l\'hiver', avoidExcess: 'l\'isolement affectif, une ambiance d\'inquiétude permanente' },
  },
};

/** 해당 언어의 오행 보완표. 없으면 null이고 호출부가 한국어 원본을 쓴다. */
function getLocalizedRemedies(language) {
  return ELEMENT_REMEDIES_I18N[language] || null;
}

/** 저작이 끝난 언어 (테스트/점검용) */
function localizedRemedyLanguages() {
  return Object.keys(ELEMENT_REMEDIES_I18N);
}

// 오행 이름을 리포트 언어에 맞게 쓴다.
//
// 프롬프트가 `부족 오행 (수) 보완` 처럼 한국어 오행명을 그대로 넣고 있었고,
// 모델이 그것을 출력에 옮겨 적으면서 `목`, `수` 같은 한 글자가 비한국어 리포트에
// 남았다. 기둥(丁酉)을 한자로 쓰는 기존 관례와 같게, 비한국어에는 한자와 영문
// 표기를 함께 준다.
const ELEMENT_LABELS = {
  '목': { hanja: '木', en: 'Wood' },
  '화': { hanja: '火', en: 'Fire' },
  '토': { hanja: '土', en: 'Earth' },
  '금': { hanja: '金', en: 'Metal' },
  '수': { hanja: '水', en: 'Water' },
};

function elementLabel(element, language) {
  const e = ELEMENT_LABELS[element];
  if (!e) return element;
  return language === 'ko' ? element : `${e.hanja} (${e.en})`;
}

module.exports = {
  ELEMENT_REMEDIES_I18N,
  getLocalizedRemedies,
  localizedRemedyLanguages,
  ELEMENT_LABELS,
  elementLabel,
};
