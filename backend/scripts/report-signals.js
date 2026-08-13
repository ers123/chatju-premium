#!/usr/bin/env node
// 실사용자 신호 다이제스트 (수동 실행용).
//
// 주간 자동 실행은 Lambda 스케줄이 같은 서비스를 부른다 —
// `src/services/signals.service.js`. 로직이 여기 있으면 사람이 보는 숫자와
// 메일로 오는 숫자가 갈라진다.
//
//   npm run signals                 # 최근 90일, DB만 읽음
//   DAYS=30 npm run signals
//   SYNC=1 npm run signals          # PayPal 상태도 확인(드라이런)
//   SYNC=1 APPLY=1 npm run signals  # 확인 + 반영
//   JSON=1 npm run signals

require('dotenv').config();

const { buildDigest, renderDigestText, syncPaymentStatuses } = require('../src/services/signals.service');

(async () => {
  const days = Number(process.env.DAYS || 90);
  const sync = process.env.SYNC === '1'
    ? await syncPaymentStatuses({ apply: process.env.APPLY === '1', days: 180 })
    : null;
  const digest = await buildDigest({ days });

  if (process.env.JSON === '1') {
    console.log(JSON.stringify({ digest, sync }, null, 2));
    return;
  }
  console.log('');
  console.log(renderDigestText(digest, sync));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
