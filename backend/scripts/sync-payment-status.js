#!/usr/bin/env node
// PayPal에 실제 결제 상태를 물어 DB와 맞춘다 — 환불을 잡기 위한 것이다.
// 로직은 `src/services/signals.service.js`에 있다(주간 잡과 공유).
//
//   npm run sync:payments            # 드라이런
//   APPLY=1 npm run sync:payments    # 반영

require('dotenv').config();

const { syncPaymentStatuses } = require('../src/services/signals.service');

(async () => {
  const apply = process.env.APPLY === '1';
  const result = await syncPaymentStatuses({ apply, days: Number(process.env.DAYS || 180) });

  console.log(`확인 ${result.checked}건${apply ? '' : ' (드라이런)'}`);
  result.changes.forEach((c) => console.log(`  ! ${c.orderId} ${c.amount} ${c.currency}: ${c.from} → ${c.to} (PayPal ${c.remote})`));
  result.errors.forEach((e) => console.log(`  ? ${e}`));
  if (!result.changes.length) console.log('불일치 없음');
  else if (!apply) console.log('\nAPPLY=1로 반영');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
