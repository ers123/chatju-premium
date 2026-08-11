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
  ja: {
    // avoid는 親がつい口にする実際の言い方、instead は誘いかけ形。
    // 命令形を避け、褒めは控えめ・具体的に(cultural-register.js の ja 参照)。
    '목': [
      {
        avoid: '「いつも始めるだけで、最後までやらないよね。」',
        instead: '「今回はどこまでやってみる？　そこまでで終わりにしていいよ。」',
      },
      {
        avoid: '「あなたに何がわかるの。」',
        instead: '「そう思ってるんだね。お母さんはちょっと違うんだけど、理由きいてくれる？」',
      },
      {
        avoid: '「お兄ちゃんはこんなことなかったのに。」',
        instead: '「これは難しかったんだよね。どこで詰まったか教えてくれる？」',
      },
    ],
    '화': [
      {
        avoid: '「ちょっと静かにして。」',
        instead: '「全部聞きたいから、これだけ終わらせるね。五分だけ待ってくれる？」',
      },
      {
        avoid: '「どうせまたすぐ飽きるでしょ。」',
        instead: '「今はこれが一番楽しいんだね。いつまでやるか一緒に決めてみようか。」',
      },
      {
        avoid: '「そんなことでどうしてそんなに怒るの。」',
        instead: '「すごく悔しかったんだね。最初から話してくれる？」',
      },
    ],
    '토': [
      {
        avoid: '「どうしてそんなに遅いの。」',
        instead: '「準備できたら教えてね。どれくらいかかるかだけ言ってくれたら待つよ。」',
      },
      {
        avoid: '「自分の意見はないの。」',
        instead: '「三つのうちどれがいい？　今決めなくていいから、思いついたら教えてね。」',
      },
      {
        avoid: '「もう気にしないで。」',
        instead: '「まだ心に残ってるんだね。どこが一番ひっかかってる？」',
      },
    ],
    '금': [
      {
        avoid: '「そこまで細かく言わなくてもいいでしょ。」',
        instead: '「あなたの中では納得できてないんだね。どうなったら納得できそう？」',
      },
      {
        avoid: '「完璧じゃなくていいから、適当でいいよ。」',
        instead: '「ここまでで十分よくできてると思うよ。あなたから見て、まだ気になるところある？」',
      },
      {
        avoid: '「もう少し融通きかせなさい。」',
        instead: '「今回は例外にしてもいい場面だと思うんだけど、どう思う？」',
      },
    ],
    '수': [
      {
        avoid: '「考えてないで、まず動きなさい。」',
        instead: '「頭の中で整理してるところだよね。今までまとまった分だけ教えてくれる？」',
      },
      {
        avoid: '「何を考えてるのか、さっぱりわからない。」',
        instead: '「言葉にしにくかったら、あとで書いて渡してくれてもいいよ。急がないから。」',
      },
      {
        avoid: '「どうしてお友だちと遊ばないの。」',
        instead: '「今日はひとりでいたい日？　部屋にいてもいいよ。」',
      },
    ],
  },
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

// 저작은 끝났지만 아직 측정 전이라 게이트를 켜지 않은 언어.
//
// 저작 → 측정 → 켜기 순서를 강제하기 위한 목록이다. 여기에 없고 게이트에도 없는
// 저작 언어가 생기면 테스트가 깨진다 — 저작해 놓고 아무 데도 안 쓰이는(= 죽은
// 작업) 상태를 막기 위해서다.
//
// 켜는 절차:
//   npm run eval:localization -- --langs=<lang> --charts=3 --rounds=3 --label=<lang>-off --regenerate
//   SAJU_LOCALIZED_VOICE=1 node scripts/eval-localization.js --langs=<lang> --charts=3 --rounds=3 --label=<lang>-on --regenerate
// script 보존율이 유의미하게 오르고 fallback이 0이면 saju-knowledge.js의
// LOCALIZED_VOICE_LANGUAGES 기본값에 추가하고 이 목록에서 뺀다.
// (비어 있음 = 저작된 언어가 모두 측정을 거쳐 켜져 있다는 뜻)
const PENDING_MEASUREMENT = [];

module.exports = { HARMFUL_PHRASES_I18N, getLocalizedHarmfulPhrases, localizedLanguages, PENDING_MEASUREMENT };

