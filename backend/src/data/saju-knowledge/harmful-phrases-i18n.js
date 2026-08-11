// 오행별 "상처가 되는 말 → 대신할 말"의 언어별 저작본
//
// 왜 번역이 아니라 저작인가
// ---------------------------------
// parent-child.js의 HARMFUL_PHRASES는 따옴표 친 한국어 부모 대사다. 비한국어
// 리포트에서 이 대사는 모델이 즉석에서 옮겨야 하는 부담이 되고, 측정해 보니
// (2026-08-11, output/localization/) 그 부담 아래에서 모델은 대사를 통째로 버리고
// 일반 육아 조언으로 대체했다. 근거 보존율 ko 75~100% vs fr 50~64%로, 두 심판이
// 공통으로 지목한 손실 지점이 정확히 이 "피할 말 3종 / 대신할 말 3종"이었다.
//
// 프롬프트로 "번역하지 말고 기능만 옮겨라"라고 지시해 봤으나 효과가 0이었다
// (동일 심판 비교에서 10/2/1 대 10/2/1로 완전히 동일). progress_2026-08-11.md
// §9.2가 경고한 대로 형식·문구를 프롬프트 지시로 강제하는 레버는 이 파이프라인에서
// 작동하지 않는다. 그래서 데이터로 박는다.
//
// 저작 원칙
// ---------------------------------
// - 한국어 문장의 번역이 아니라, 같은 기능을 하는 그 나라 부모의 실제 말을 쓴다.
//   («형은 안 그랬는데» → « Ton frère, lui, il n'en faisait pas toute une histoire. »)
// - avoid는 그 문화권 부모가 실제로 무심코 내뱉는 말이어야 한다. 교과서 문장이면
//   부모가 자기 모습을 못 알아본다.
// - instead는 부모가 그대로 소리 내어 읽을 수 있는 길이여야 한다.
// - why(왜 상처가 되는지)는 분석이라 원본 한국어를 그대로 쓴다. 모델이 근거로만
//   삼고 출력에는 옮기지 않는다.
//
// 새 언어를 추가할 때는 그 언어를 모어로 쓰는 사람이 avoid 문장을 읽고 "우리 엄마가
// 하는 말"이라고 느끼는지부터 확인할 것. 그 감각이 없으면 번역본이다.

const HARMFUL_PHRASES_I18N = {
  fr: {
    '목': [
      {
        avoid: '« Tu commences tout et tu ne finis jamais rien. »',
        instead: '« Tu veux aller jusqu\'où, cette fois ? On s\'arrête là et c\'est très bien comme ça. »',
      },
      {
        avoid: '« Qu\'est-ce que tu en sais, toi ? »',
        instead: '« D\'accord, toi tu le vois comme ça. Moi je le vois autrement — je t\'explique pourquoi ? »',
      },
      {
        avoid: '« Ton frère, lui, il n\'en faisait pas toute une histoire. »',
        instead: '« Ça, c\'était compliqué pour toi. Tu me montres où ça a coincé ? »',
      },
    ],
    '화': [
      {
        avoid: '« Bon, ça suffit, deux minutes de calme. »',
        instead: '« Je veux tout entendre, promis. Je finis ça et je suis à toi dans cinq minutes. »',
      },
      {
        avoid: '« De toute façon, dans quinze jours tu n\'y toucheras plus. »',
        instead: '« C\'est ça qui te passionne en ce moment. On décide ensemble jusqu\'à quand tu t\'y tiens ? »',
      },
      {
        avoid: '« Tu ne vas pas en faire tout un drame. »',
        instead: '« Ça t\'a vraiment contrarié. Raconte-moi depuis le début. »',
      },
    ],
    '토': [
      {
        avoid: '« Mais qu\'est-ce que tu es lent ! »',
        instead: '« Préviens-moi quand tu es prêt. Dis-moi juste combien de temps il te faut, j\'attends. »',
      },
      {
        avoid: '« Tu n\'as jamais d\'avis, toi. »',
        instead: '« Lequel des trois te va le mieux ? Tu n\'es pas obligé de choisir maintenant, dis-le-moi quand tu sauras. »',
      },
      {
        avoid: '« Arrête, laisse tomber. »',
        instead: '« Ça te reste encore en travers. C\'est quoi qui te gêne le plus ? »',
      },
    ],
    '금': [
      {
        avoid: '« Tu chipotes vraiment pour rien. »',
        instead: '« Pour toi ce n\'est pas juste. Qu\'est-ce qu\'il faudrait pour que ça te paraisse correct ? »',
      },
      {
        avoid: '« Ce n\'est pas grave, fais-le vite fait, ça ira. »',
        instead: '« Moi je trouve que c\'est déjà très bien. Toi, tu vois encore quelque chose à reprendre ? »',
      },
      {
        avoid: '« Sois un peu plus souple, quand même. »',
        instead: '« Là, je crois qu\'on peut faire une exception. Toi, tu en penses quoi ? »',
      },
    ],
    '수': [
      {
        avoid: '« Arrête de réfléchir et fais-le. »',
        instead: '« Tu es en train de mettre tout ça au clair, c\'est ça ? Dis-moi juste ce qui est déjà clair. »',
      },
      {
        avoid: '« On ne sait jamais ce que tu penses. »',
        instead: '« Si c\'est difficile à dire, tu peux me l\'écrire plus tard. Rien ne presse. »',
      },
      {
        avoid: '« Pourquoi tu ne joues pas avec les autres ? »',
        instead: '« C\'est un jour où tu as besoin d\'être tranquille ? Tu peux rester dans ta chambre si tu veux. »',
      },
    ],
  },
};

/**
 * 해당 언어·오행의 저작된 대사쌍을 돌려준다. 없으면 null이고, 호출부는 한국어
 * 원본으로 되돌아간다 — 아직 저작되지 않은 언어가 조용히 빈 블록을 받지 않도록.
 */
function getLocalizedHarmfulPhrases(language, element) {
  return HARMFUL_PHRASES_I18N[language]?.[element] || null;
}

/** 저작이 끝난 언어 목록 (테스트/운영 점검용) */
function localizedLanguages() {
  return Object.keys(HARMFUL_PHRASES_I18N);
}

module.exports = { HARMFUL_PHRASES_I18N, getLocalizedHarmfulPhrases, localizedLanguages };
