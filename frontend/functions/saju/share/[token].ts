/**
 * 공유 페이지 — Cloudflare Pages Function (엣지에서 요청마다 실행).
 *
 * 왜 정적 페이지가 아닌가: 카카오톡·Threads·iMessage 같은 앱은 링크를 받으면 그
 * URL을 긁어 `og:title`·`og:image`로 미리보기 카드를 만든다. 그 값이 **공유 건마다
 * 달라야** 하는데, 프론트는 `output: 'export'`(빌드 시점에 HTML을 다 구움)라
 * 아직 존재하지 않는 토큰의 페이지를 미리 만들 수 없다. 그래서 이 경로만 엣지가
 * 가로채 그때그때 HTML을 만든다. 나머지 사이트는 정적 그대로다.
 *
 * 개인정보: 이 페이지에 아이 이름도 생년월일도 없다. 백엔드 `/saju/share/:token`이
 * 오행 결과만 돌려주기 때문에, **여기서 실수로 노출할 데이터가 애초에 없다.**
 */

interface Env {
  NEXT_PUBLIC_API_URL?: string;
}

const SITE = 'https://somyung.cc';

const ELEMENT: Record<string, Record<string, { name: string; emoji: string; trait: string }>> = {
  ko: {
    wood: { name: '목(木)', emoji: '🌳', trait: '자라려는 힘이 강한' },
    fire: { name: '화(火)', emoji: '🔥', trait: '밝게 타오르는' },
    earth: { name: '토(土)', emoji: '⛰️', trait: '품이 넓고 든든한' },
    metal: { name: '금(金)', emoji: '⚔️', trait: '기준이 분명한' },
    water: { name: '수(水)', emoji: '💧', trait: '깊고 유연한' },
  },
  en: {
    wood: { name: 'Wood', emoji: '🌳', trait: 'a natural builder' },
    fire: { name: 'Fire', emoji: '🔥', trait: 'bright and expressive' },
    earth: { name: 'Earth', emoji: '⛰️', trait: 'steady and caring' },
    metal: { name: 'Metal', emoji: '⚔️', trait: 'clear and principled' },
    water: { name: 'Water', emoji: '💧', trait: 'deep and adaptable' },
  },
  ja: {
    wood: { name: '木', emoji: '🌳', trait: '伸びようとする力が強い' },
    fire: { name: '火', emoji: '🔥', trait: '明るく燃える' },
    earth: { name: '土', emoji: '⛰️', trait: '包容力のある' },
    metal: { name: '金', emoji: '⚔️', trait: '筋の通った' },
    water: { name: '水', emoji: '💧', trait: '深くしなやかな' },
  },
};

const COPY: Record<string, { title: (e: string) => string; desc: string; cta: string; sub: string; note: string }> = {
  ko: {
    title: (e) => `우리 아이는 ${e} 기질입니다`,
    desc: '사주 여덟 글자로 읽은 아이의 타고난 기질. 3분이면 우리 아이 결과도 볼 수 있어요.',
    cta: '우리 아이 기질 무료로 보기',
    sub: '오행 분포',
    note: '이 페이지에는 아이의 이름과 생년월일이 포함되지 않습니다.',
  },
  en: {
    title: (e) => `My child is a ${e} element child`,
    desc: "A child's innate temperament, read from the Four Pillars. See your own child's result in 3 minutes.",
    cta: "See your child's temperament — free",
    sub: 'Five Elements balance',
    note: "This page contains no child's name or birth date.",
  },
  ja: {
    title: (e) => `うちの子は${e}の気質です`,
    desc: '四柱八字から読んだ、生まれ持った気質。3分でお子様の結果も見られます。',
    cta: 'お子様の気質を無料で見る',
    sub: '五行バランス',
    note: 'このページにお子様の名前や生年月日は含まれません。',
  },
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = String(context.params.token || '');
  const api = context.env.NEXT_PUBLIC_API_URL || 'https://0eo64hyuv7.execute-api.ap-northeast-2.amazonaws.com';

  let share: { dominantElement: string; elementCounts: Record<string, number>; language: string } | null = null;
  try {
    const res = await fetch(`${api}/saju/share/${encodeURIComponent(token)}`, {
      headers: { accept: 'application/json' },
    });
    if (res.ok) share = await res.json();
  } catch {
    // 백엔드가 죽어도 링크가 500을 뱉지 않는다 — 아래에서 홈으로 보낸다.
  }

  // 없거나 철회된 링크는 홈으로. 404 페이지를 따로 만들면 "존재했다가 사라진
  // 링크"임을 알려주는 셈이라, 부모가 껐다는 사실 자체가 노출된다.
  if (!share || !share.dominantElement) {
    return Response.redirect(`${SITE}/`, 302);
  }

  const lang = ELEMENT[share.language] ? share.language : 'en';
  const el = ELEMENT[lang][share.dominantElement] || ELEMENT[lang].wood;
  const copy = COPY[lang] || COPY.en;
  const title = copy.title(el.name);
  const url = `${SITE}/saju/share/${token}/`;
  // 오행별 전용 OG 이미지는 아직 없다. 없는 경로를 가리키면 미리보기 카드가
  // 이미지 없이 깨져 보이므로, 존재가 확인된 언어별 히어로 이미지를 쓴다.
  // (오행별 이미지가 생기면 여기만 바꾸면 된다.)
  const ogLang = ['ko', 'en', 'ja'].includes(lang) ? lang : 'en';
  const ogImage = `${SITE}/assets/images/marketing/og-hero-${ogLang}.png`;
  const startUrl = `${SITE}/${lang}/saju/input/?utm_source=share&utm_medium=social&utm_campaign=result`;

  const counts = share.elementCounts || {};
  const order = ['wood', 'fire', 'earth', 'metal', 'water'];
  const max = Math.max(1, ...order.map((k) => Number(counts[k]) || 0));
  const bars = order
    .map((k) => {
      const v = Number(counts[k]) || 0;
      const pct = Math.round((v / max) * 100);
      const meta = ELEMENT[lang][k];
      return `<div class="row"><span class="lab">${meta.emoji} ${esc(meta.name)}</span>
        <span class="bar"><i style="width:${pct}%"></i></span><b>${v}</b></div>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | SoMyung</title>
<meta name="description" content="${esc(copy.desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SoMyung">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(copy.desc)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(copy.desc)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="canonical" href="${url}">
<!-- 공유 결과 페이지는 검색에 쌓일 이유가 없다. 인덱싱되면 같은 내용의 얇은
     페이지가 수천 개 생겨 사이트 전체 평가가 내려간다. -->
<meta name="robots" content="noindex,follow">
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
background:#FAF8F5;color:#2C2420;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.card{max-width:420px;width:100%;background:#fff;border:1px solid rgba(44,36,32,.08);
border-radius:24px;padding:40px 32px;text-align:center;box-shadow:0 12px 40px rgba(44,36,32,.06)}
.emoji{font-size:56px;line-height:1;margin-bottom:16px}
h1{font-size:24px;line-height:1.4;margin:0 0 8px;letter-spacing:-.02em}
.trait{color:#6B6560;font-size:15px;margin:0 0 28px}
.sub{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9B948E;margin:0 0 12px}
.row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px}
.lab{width:88px;text-align:left;color:#4A443F}
.bar{flex:1;height:8px;background:#F0EBE5;border-radius:4px;overflow:hidden}
.bar i{display:block;height:100%;background:#4A6354;border-radius:4px}
.row b{width:20px;text-align:right;color:#2C2420}
a.cta{display:block;margin-top:28px;background:#1A3D2E;color:#fff;text-decoration:none;
padding:16px;border-radius:12px;font-weight:600;font-size:15px}
.note{margin:16px 0 0;font-size:11.5px;color:#9B948E;line-height:1.6}
</style>
</head>
<body>
<main class="card">
  <div class="emoji">${el.emoji}</div>
  <h1>${esc(title)}</h1>
  <p class="trait">${esc(el.trait)}</p>
  <p class="sub">${esc(copy.sub)}</p>
  ${bars}
  <a class="cta" href="${startUrl}">${esc(copy.cta)}</a>
  <p class="note">${esc(copy.note)}</p>
</main>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // 링크는 자주 안 바뀌지만 철회는 즉시 반영돼야 한다 — 짧게 캐시한다.
      'cache-control': 'public, max-age=60',
    },
  });
};
